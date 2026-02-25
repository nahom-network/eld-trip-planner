"""
HOS (Hours of Service) Engine.
Implements FMCSA 70-hr/8-day rules for property-carrying drivers.

Rules:
  - 11-hour driving limit per shift
  - 14-hour on-duty window per shift
  - 10-hour off-duty rest between shifts
  - 30-minute break required after 8 consecutive hours of driving
  - 70-hour cycle over 8 days
  - Fuel stop every 1,000 miles (30 min)
  - 1 hour each for pickup and dropoff
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple

# ── Constants ─────────────────────────────────────────────────────────────────

DRIVING_LIMIT_HRS = 11.0
WINDOW_LIMIT_HRS = 14.0
REST_DURATION_HRS = 10.0
BREAK_INTERVAL_HRS = 8.0
BREAK_DURATION_HRS = 0.5
FUEL_INTERVAL_MILES = 1000.0
FUEL_DURATION_HRS = 0.5
PICKUP_DROPOFF_HRS = 1.0
CYCLE_LIMIT_HRS = 70.0


class CycleExceededError(Exception):
    pass


# ── Data Classes ──────────────────────────────────────────────────────────────


@dataclass
class StopData:
    stop_type: str  # start | pickup | dropoff | fuel | rest | break
    location_name: str
    lat: Optional[float]
    lng: Optional[float]
    arrival_time: datetime
    departure_time: datetime
    duration_hours: float
    cumulative_miles: float
    order: int
    notes: str = ""


@dataclass
class ActivitySlot:
    """One contiguous block on the HOS grid for a single calendar day."""

    start_hour: float  # 0.0–24.0
    end_hour: float
    status: str  # off_duty | sleeper_berth | driving | on_duty_nd


@dataclass
class DailyLogData:
    date: date
    day_number: int
    activities: List[dict]  # serialisable ActivitySlot dicts
    total_driving_hours: float
    total_on_duty_hours: float  # driving + on_duty_nd
    total_off_duty_hours: float
    total_sleeper_hours: float
    cycle_hours_used: float  # cumulative at end of day
    from_location: str
    to_location: str
    total_miles: float


@dataclass
class TripPlan:
    stops: List[StopData]
    daily_logs: List[DailyLogData]


@dataclass
class _State:
    """Mutable planner state."""

    now: datetime
    driving_shift_hrs: float  # driving hours in current shift (reset after rest)
    window_hrs: float  # on-duty window elapsed (reset after rest)
    shift_start: datetime  # when current shift started
    continuous_driving_hrs: float  # since last break or rest
    cycle_hrs: float  # rolling 70-hr cycle
    miles_since_fuel: float
    cumulative_miles: float
    current_location_name: str
    current_lat: Optional[float]
    current_lng: Optional[float]


@dataclass
class _DayBuilder:
    """Accumulates activities for one calendar day."""

    log_date: date
    day_number: int
    from_location: str
    to_location: str
    start_miles: float
    slots: List[ActivitySlot] = field(default_factory=list)
    last_hour: float = 0.0

    def add(self, status: str, start_h: float, end_h: float) -> None:
        if end_h <= start_h:
            return
        # Fill any gap from last_hour to start_h as off_duty (e.g. driver started mid-day)
        if start_h > self.last_hour + 1e-6:
            gap_status = "off_duty"
            if self.slots and self.slots[-1].status == gap_status:
                self.slots[-1].end_hour = start_h
            else:
                self.slots.append(ActivitySlot(self.last_hour, start_h, gap_status))
            self.last_hour = start_h
        # Merge adjacent same-status slots
        if (
            self.slots
            and self.slots[-1].status == status
            and abs(self.slots[-1].end_hour - start_h) < 1e-6
        ):
            self.slots[-1].end_hour = end_h
        else:
            self.slots.append(ActivitySlot(start_h, end_h, status))
        self.last_hour = end_h

    def fill_remaining_off_duty(self) -> None:
        if self.last_hour < 24.0:
            self.add("off_duty", self.last_hour, 24.0)

    def to_data(self, cycle_hrs_used: float, end_miles: float) -> DailyLogData:
        driving = sum(
            s.end_hour - s.start_hour for s in self.slots if s.status == "driving"
        )
        on_duty_nd = sum(
            s.end_hour - s.start_hour for s in self.slots if s.status == "on_duty_nd"
        )
        off_duty = sum(
            s.end_hour - s.start_hour for s in self.slots if s.status == "off_duty"
        )
        sleeper = sum(
            s.end_hour - s.start_hour for s in self.slots if s.status == "sleeper_berth"
        )
        return DailyLogData(
            date=self.log_date,
            day_number=self.day_number,
            activities=[
                {"start_hour": s.start_hour, "end_hour": s.end_hour, "status": s.status}
                for s in self.slots
            ],
            total_driving_hours=round(driving, 4),
            total_on_duty_hours=round(driving + on_duty_nd, 4),
            total_off_duty_hours=round(off_duty, 4),
            total_sleeper_hours=round(sleeper, 4),
            cycle_hours_used=round(cycle_hrs_used, 4),
            from_location=self.from_location,
            to_location=self.to_location,
            total_miles=round(end_miles - self.start_miles, 2),
        )


# ── Planner ───────────────────────────────────────────────────────────────────


class HOSPlanner:
    """
    Plan a truck trip respecting all FMCSA HOS rules.

    Usage::

        planner = HOSPlanner()
        plan = planner.plan(
            leg_current_to_pickup=(miles, hours),
            leg_pickup_to_dropoff=(miles, hours),
            current_location="Chicago, IL",
            pickup_location="Milwaukee, WI",
            dropoff_location="Indianapolis, IN",
            current_cycle_used=20.0,
            start_time=datetime(2026, 2, 25, 8, 0),
            current_lat=41.8781, current_lng=-87.6298,
            pickup_lat=43.0389, pickup_lng=-87.9065,
            dropoff_lat=39.7684, dropoff_lng=-86.1581,
        )
    """

    def plan(
        self,
        leg_current_to_pickup: Tuple[float, float],  # (miles, hours)
        leg_pickup_to_dropoff: Tuple[float, float],
        current_location: str,
        pickup_location: str,
        dropoff_location: str,
        current_cycle_used: float,
        start_time: datetime,
        current_lat: Optional[float] = None,
        current_lng: Optional[float] = None,
        pickup_lat: Optional[float] = None,
        pickup_lng: Optional[float] = None,
        dropoff_lat: Optional[float] = None,
        dropoff_lng: Optional[float] = None,
    ) -> TripPlan:
        if current_cycle_used >= CYCLE_LIMIT_HRS:
            raise CycleExceededError(
                f"Cycle hours ({current_cycle_used}) already at or above the 70-hr limit."
            )

        self._stops: List[StopData] = []
        self._day_logs: List[DailyLogData] = []
        self._order = 0
        self._day_builders: List[_DayBuilder] = []

        state = _State(
            now=start_time,
            driving_shift_hrs=0.0,
            window_hrs=0.0,
            shift_start=start_time,
            continuous_driving_hrs=0.0,
            cycle_hrs=current_cycle_used,
            miles_since_fuel=0.0,
            cumulative_miles=0.0,
            current_location_name=current_location,
            current_lat=current_lat,
            current_lng=current_lng,
        )

        day_builder = _DayBuilder(
            log_date=start_time.date(),
            day_number=1,
            from_location=current_location,
            to_location=dropoff_location,
            start_miles=0.0,
        )

        # 0. Start stop
        self._add_stop(
            "start",
            current_location,
            current_lat,
            current_lng,
            state.now,
            state.now,
            0.0,
            0.0,
        )

        # 1. Drive current → pickup
        state, day_builder = self._drive_segment(
            state,
            day_builder,
            segment_miles=leg_current_to_pickup[0],
            segment_hours=leg_current_to_pickup[1],
            dest_name=pickup_location,
            dest_lat=pickup_lat,
            dest_lng=pickup_lng,
            dropoff_location=dropoff_location,
        )

        # 2. Pickup stop (1 hour on_duty_nd)
        pickup_arrive = state.now
        state, day_builder = self._do_on_duty_stop(
            state,
            day_builder,
            dur_hrs=PICKUP_DROPOFF_HRS,
            stop_type="pickup",
            location_name=pickup_location,
            lat=pickup_lat,
            lng=pickup_lng,
            dropoff_location=dropoff_location,
        )

        # 3. Drive pickup → dropoff
        state, day_builder = self._drive_segment(
            state,
            day_builder,
            segment_miles=leg_pickup_to_dropoff[0],
            segment_hours=leg_pickup_to_dropoff[1],
            dest_name=dropoff_location,
            dest_lat=dropoff_lat,
            dest_lng=dropoff_lng,
            dropoff_location=dropoff_location,
        )

        # 4. Dropoff stop (1 hour on_duty_nd)
        state, day_builder = self._do_on_duty_stop(
            state,
            day_builder,
            dur_hrs=PICKUP_DROPOFF_HRS,
            stop_type="dropoff",
            location_name=dropoff_location,
            lat=dropoff_lat,
            lng=dropoff_lng,
            dropoff_location=dropoff_location,
        )

        # Finalise last day
        day_builder.fill_remaining_off_duty()
        self._day_logs.append(
            day_builder.to_data(state.cycle_hrs, state.cumulative_miles)
        )

        return TripPlan(stops=self._stops, daily_logs=self._day_logs)

    # ── internal helpers ─────────────────────────────────────────────────────

    def _next_order(self) -> int:
        n = self._order
        self._order += 1
        return n

    def _add_stop(
        self,
        stop_type,
        location_name,
        lat,
        lng,
        arrival,
        departure,
        duration_hrs,
        cumulative_miles,
        notes="",
    ):
        self._stops.append(
            StopData(
                stop_type=stop_type,
                location_name=location_name,
                lat=lat,
                lng=lng,
                arrival_time=arrival,
                departure_time=departure,
                duration_hours=round(duration_hrs, 4),
                cumulative_miles=round(cumulative_miles, 2),
                order=self._next_order(),
                notes=notes,
            )
        )

    def _hour_in_day(self, dt: datetime) -> float:
        """Return fractional hour within calendar day (0.0–24.0)."""
        return dt.hour + dt.minute / 60.0 + dt.second / 3600.0

    def _advance_time(
        self,
        state: _State,
        day_builder: _DayBuilder,
        hours: float,
        status: str,
        dropoff_location: str,
    ) -> Tuple[_State, _DayBuilder]:
        """
        Advance `now` by `hours`, recording `status` activities, handling day
        boundaries (midnight crossings) and updating relevant state counters.
        """
        remaining = hours
        while remaining > 1e-6:
            hour_in_day = self._hour_in_day(state.now)
            hours_left_in_day = 24.0 - hour_in_day
            chunk = min(remaining, hours_left_in_day)

            day_builder.add(status, hour_in_day, hour_in_day + chunk)
            state.now += timedelta(hours=chunk)
            remaining -= chunk

            if remaining > 1e-6:
                # Midnight crossed → finalise current day, start new one
                day_builder.fill_remaining_off_duty()
                self._day_logs.append(
                    day_builder.to_data(state.cycle_hrs, state.cumulative_miles)
                )
                new_day_num = len(self._day_logs) + 1
                day_builder = _DayBuilder(
                    log_date=state.now.date(),
                    day_number=new_day_num,
                    from_location=state.current_location_name,
                    to_location=dropoff_location,
                    start_miles=state.cumulative_miles,
                )

        return state, day_builder

    def _do_rest(
        self,
        state: _State,
        day_builder: _DayBuilder,
        at_location: str,
        lat,
        lng,
        dropoff_location: str,
    ) -> Tuple[_State, _DayBuilder, _DayBuilder]:
        """Insert a mandatory 10-hr off-duty rest, return updated state and builder."""
        arrive = state.now
        state, day_builder = self._advance_time(
            state, day_builder, REST_DURATION_HRS, "off_duty", dropoff_location
        )
        self._add_stop(
            "rest",
            at_location,
            lat,
            lng,
            arrive,
            state.now,
            REST_DURATION_HRS,
            state.cumulative_miles,
            notes="Mandatory 10-hr off-duty rest (HOS)",
        )
        # Reset shift counters
        state.driving_shift_hrs = 0.0
        state.window_hrs = 0.0
        state.shift_start = state.now
        state.continuous_driving_hrs = 0.0
        return state, day_builder

    def _do_break(
        self,
        state: _State,
        day_builder: _DayBuilder,
        at_location: str,
        lat,
        lng,
        dropoff_location: str,
    ) -> Tuple[_State, _DayBuilder]:
        """Insert a 30-min on-duty-not-driving break."""
        arrive = state.now
        state, day_builder = self._advance_time(
            state, day_builder, BREAK_DURATION_HRS, "on_duty_nd", dropoff_location
        )
        self._add_stop(
            "break",
            at_location,
            lat,
            lng,
            arrive,
            state.now,
            BREAK_DURATION_HRS,
            state.cumulative_miles,
            notes="Mandatory 30-min break (8-hr driving rule)",
        )
        state.window_hrs += BREAK_DURATION_HRS
        state.cycle_hrs += BREAK_DURATION_HRS
        state.continuous_driving_hrs = 0.0
        return state, day_builder

    def _do_fuel(
        self,
        state: _State,
        day_builder: _DayBuilder,
        at_location: str,
        lat,
        lng,
        dropoff_location: str,
    ) -> Tuple[_State, _DayBuilder]:
        """Insert a 30-min fuel stop (on-duty not driving)."""
        arrive = state.now
        state, day_builder = self._advance_time(
            state, day_builder, FUEL_DURATION_HRS, "on_duty_nd", dropoff_location
        )
        self._add_stop(
            "fuel",
            at_location,
            lat,
            lng,
            arrive,
            state.now,
            FUEL_DURATION_HRS,
            state.cumulative_miles,
            notes="Fuel stop (max 1,000 miles between fuels)",
        )
        state.window_hrs += FUEL_DURATION_HRS
        state.cycle_hrs += FUEL_DURATION_HRS
        state.miles_since_fuel = 0.0
        return state, day_builder

    def _do_on_duty_stop(
        self,
        state: _State,
        day_builder: _DayBuilder,
        dur_hrs: float,
        stop_type: str,
        location_name: str,
        lat,
        lng,
        dropoff_location: str,
    ) -> Tuple[_State, _DayBuilder]:
        """Handle pickup or dropoff (1 hr on_duty_nd). May trigger rest if window exhausted."""
        # Check if on-duty window allows this stop
        if state.window_hrs + dur_hrs > WINDOW_LIMIT_HRS:
            state, day_builder = self._do_rest(
                state, day_builder, location_name, lat, lng, dropoff_location
            )

        arrive = state.now
        state, day_builder = self._advance_time(
            state, day_builder, dur_hrs, "on_duty_nd", dropoff_location
        )
        self._add_stop(
            stop_type,
            location_name,
            lat,
            lng,
            arrive,
            state.now,
            dur_hrs,
            state.cumulative_miles,
        )
        state.window_hrs += dur_hrs
        state.cycle_hrs += dur_hrs
        state.continuous_driving_hrs = 0.0  # resets after on_duty_nd activity
        state.current_location_name = location_name
        state.current_lat = lat
        state.current_lng = lng
        return state, day_builder

    def _drive_segment(
        self,
        state: _State,
        day_builder: _DayBuilder,
        segment_miles: float,
        segment_hours: float,
        dest_name: str,
        dest_lat,
        dest_lng,
        dropoff_location: str,
    ) -> Tuple[_State, _DayBuilder]:
        """
        Drive `segment_miles` / `segment_hours`, inserting stops (break, fuel, rest)
        as HOS limits are reached.
        """
        if segment_miles <= 0:
            return state, day_builder

        avg_speed = segment_miles / segment_hours  # mph

        remaining_miles = segment_miles
        remaining_hours = segment_hours

        while remaining_miles > 1e-3:
            # How far/long can we drive before hitting each constraint?
            time_to_driving_limit = DRIVING_LIMIT_HRS - state.driving_shift_hrs
            time_to_window_limit = WINDOW_LIMIT_HRS - state.window_hrs
            time_to_break = BREAK_INTERVAL_HRS - state.continuous_driving_hrs
            cycle_remaining = CYCLE_LIMIT_HRS - state.cycle_hrs
            miles_to_fuel = FUEL_INTERVAL_MILES - state.miles_since_fuel

            # Convert mile-limits to time
            time_to_fuel = miles_to_fuel / avg_speed

            # Nearest time constraint
            max_drive_time = min(
                time_to_driving_limit,
                time_to_window_limit,
                time_to_break,
                time_to_fuel,
                remaining_hours,  # don't go past destination
            )

            if max_drive_time <= 1e-6:
                # Determine which limit was hit and handle it
                if time_to_driving_limit <= 1e-6 or time_to_window_limit <= 1e-6:
                    # Need mandatory rest
                    loc = self._interpolated_location(
                        state.current_location_name,
                        dest_name,
                        segment_miles,
                        remaining_miles,
                    )
                    state, day_builder = self._do_rest(
                        state, day_builder, loc, None, None, dropoff_location
                    )
                elif time_to_break <= 1e-6:
                    loc = self._interpolated_location(
                        state.current_location_name,
                        dest_name,
                        segment_miles,
                        remaining_miles,
                    )
                    state, day_builder = self._do_break(
                        state, day_builder, loc, None, None, dropoff_location
                    )
                elif time_to_fuel <= 1e-6:
                    loc = self._interpolated_location(
                        state.current_location_name,
                        dest_name,
                        segment_miles,
                        remaining_miles,
                    )
                    state, day_builder = self._do_fuel(
                        state, day_builder, loc, None, None, dropoff_location
                    )
                else:
                    break  # should not happen
                continue

            # Actually drive for max_drive_time
            drive_time = min(max_drive_time, remaining_hours)
            drive_miles = drive_time * avg_speed

            # Record driving activity
            state, day_builder = self._advance_time(
                state, day_builder, drive_time, "driving", dropoff_location
            )

            # Update state
            state.driving_shift_hrs += drive_time
            state.window_hrs += drive_time
            state.continuous_driving_hrs += drive_time
            state.cycle_hrs += drive_time
            state.miles_since_fuel += drive_miles
            state.cumulative_miles += drive_miles
            remaining_miles -= drive_miles
            remaining_hours -= drive_time

            # Check if we've now hit a limit
            hit_rest = (
                state.driving_shift_hrs >= DRIVING_LIMIT_HRS - 1e-6
                or state.window_hrs >= WINDOW_LIMIT_HRS - 1e-6
            )
            hit_break = state.continuous_driving_hrs >= BREAK_INTERVAL_HRS - 1e-6
            hit_fuel = state.miles_since_fuel >= FUEL_INTERVAL_MILES - 1e-3

            if remaining_miles > 1e-3:
                loc = self._interpolated_location(
                    state.current_location_name,
                    dest_name,
                    segment_miles,
                    remaining_miles,
                )
                if hit_rest:
                    state, day_builder = self._do_rest(
                        state, day_builder, loc, None, None, dropoff_location
                    )
                elif hit_break:
                    state, day_builder = self._do_break(
                        state, day_builder, loc, None, None, dropoff_location
                    )
                elif hit_fuel:
                    state, day_builder = self._do_fuel(
                        state, day_builder, loc, None, None, dropoff_location
                    )

        # Arrived at destination
        state.current_location_name = dest_name
        state.current_lat = dest_lat
        state.current_lng = dest_lng
        return state, day_builder

    @staticmethod
    def _interpolated_location(
        origin: str, dest: str, total_miles: float, remaining_miles: float
    ) -> str:
        pct = int(100 * (1 - remaining_miles / max(total_miles, 1)))
        return f"En route {origin} → {dest} ({pct}%)"
