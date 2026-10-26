#!/usr/bin/env python3
"""Create a repeatable 200-day Greenwick forecast cache for the site."""
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
import json
import math
import random

ROOT = Path(__file__).resolve().parents[1]
START = datetime.now(ZoneInfo("America/Belize")).date()
COUNT = 200

# Electorate names are supplied by the project brief. Each gets a distinct
# generated town/seat and one broad climate district for regional weather systems.
PLACES = [
    ("Silvershore", "Port Silver", "Coast & Islands", "coast"),
    ("Stormhaven", "Galehaven", "Coast & Islands", "coast"),
    ("Moonhaven", "Moonhaven City", "Coast & Islands", "coast"),
    ("Stonewick", "Stonewick Cross", "Western Ranges", "upland"),
    ("Mooncrest", "Crescent Hill", "Western Ranges", "upland"),
    ("Riverport", "Port Riverton", "Riverlands", "river"),
    ("Ashfield", "Ashcombe", "Central Plains", "inland"),
    ("Pinegrove", "Pineford", "Northern Forests", "upland"),
    ("Ironford", "Ironford Vale", "Central Plains", "inland"),
    ("Lakepoint", "Point Lake", "Lake District", "lake"),
    ("Willowridge", "Willow Ridge", "Riverlands", "river"),
    ("Silverford", "Silverford-on-Wye", "Riverlands", "river"),
    ("Goldenport", "Port Aurelia", "Coast & Islands", "coast"),
    ("Shadowvale", "Shadewell", "Western Ranges", "upland"),
    ("Falconbridge", "Falconbridge City", "Coast & Islands", "coast"),
    ("Starfield", "Starfield Downs", "Central Plains", "inland"),
    ("Lionstead", "Lionstead", "Central Plains", "inland"),
    ("Moonport", "Port Selene", "Coast & Islands", "coast"),
    ("Rivercrest", "Creston Reach", "Riverlands", "river"),
    ("Stonegrove", "Stonegrove", "Western Ranges", "upland"),
    ("Pinehaven", "Pinehaven Bay", "Northern Forests", "coast"),
    ("Ashport", "Ashport Quay", "Coast & Islands", "coast"),
    ("Shadowridge", "Ravenscar", "Western Ranges", "upland"),
    ("Moonstead", "Moonstead Green", "Central Plains", "inland"),
    ("Silverridge", "Silverridge", "Western Ranges", "upland"),
    ("Goldenridge", "Goldmere Heights", "Western Ranges", "upland"),
    ("Falconport", "Falconport", "Coast & Islands", "coast"),
    ("Riverford", "Fordham", "Riverlands", "river"),
    ("Stonefield", "Stonefield Market", "Central Plains", "inland"),
    ("Willowford", "Willowford", "Riverlands", "river"),
    ("Starport", "Port Estrella", "Coast & Islands", "coast"),
    ("Lionridge", "Lionridge", "Western Ranges", "upland"),
    ("Moonfield", "Moonfield", "Central Plains", "inland"),
    ("Lakebridge", "Bridgewater", "Lake District", "lake"),
    ("Ashstead", "Ashstead Common", "Central Plains", "inland"),
    ("Ironpoint", "Ironpoint Harbour", "Coast & Islands", "coast"),
    ("Shadowford", "Shadowford", "Riverlands", "river"),
    ("Moonridge", "Moonridge", "Western Ranges", "upland"),
    ("East Valley", "Eastvale", "Central Plains", "inland"),
    ("Harbor Heights", "Harbour Heights", "Coast & Islands", "coast"),
    ("Clearwater", "Clearwater Bay", "Lake District", "lake"),
    ("Northbridge", "Northbridge City", "Northern Forests", "river"),
    ("Westfield", "Westfield City", "Western Ranges", "upland"),
]

COASTS = {0, 1, 2, 5, 9, 12, 14, 17, 20, 21, 26, 30, 35, 39, 40}
RIVERS = {5, 10, 11, 18, 27, 29, 36, 41}
INLAND = {6, 8, 15, 16, 23, 28, 32, 34, 38}
UPLAND = {3, 4, 7, 13, 19, 22, 24, 25, 31, 37, 42}
LAKES = {9, 33, 40}

def stable_rng(area_index, day_index):
    return random.Random((area_index + 101) * 100_003 + (day_index + 19) * 9_176)

def is_coastal_event(area_index):
    return area_index in COASTS or area_index in RIVERS or area_index in LAKES

def is_inland(area_index):
    return area_index in INLAND or area_index in UPLAND

def day_weather(area_index, day_index, date_value, previous_rain=0):
    rng = stable_rng(area_index, day_index)
    profile = PLACES[area_index][3]
    seasonal = 5.4 * math.cos(2 * math.pi * ((date_value.timetuple().tm_yday - 20) / 365))
    base = {"coast": 26.5, "lake": 27, "river": 29, "inland": 30.5, "upland": 24.5}[profile]
    max_c = base + seasonal + rng.uniform(-2.4, 2.7)
    min_c = max_c - rng.uniform(7.5, 13.5)
    wet_base = {"coast": 27, "lake": 25, "river": 23, "upland": 19, "inland": 15}[profile]
    seasonal_rain = 9 * math.cos(2 * math.pi * ((date_value.timetuple().tm_yday - 35) / 365))
    persistence = 12 if previous_rain >= 10 else 0
    rain_chance = min(94, max(4, round(wet_base + seasonal_rain + persistence + rng.uniform(-13, 17))))
    if rng.random() < rain_chance / 100:
        rain_mm = max(0, rng.gammavariate(1.35, 7.0) - 1.5)
        if previous_rain >= 10:
            rain_mm *= 1.3
    else:
        rain_mm = 0
    gust = rng.randint(11, 31) + (8 if profile == "coast" else 3 if profile == "river" else 0)
    wind = max(4, gust - rng.randint(4, 13))
    system = "Local weather pattern"

    # A few broad systems recur in known regions, producing occasional major events.
    # The displayed warning engine reads only these resulting daily values.
    if 4 <= day_index <= 6 and area_index in {6, 8, 15, 16, 23, 28, 32, 34, 38}:
        max_c = 39 + (day_index - 5) * .7 + rng.uniform(-.4, .6)
        min_c = max(24, max_c - rng.uniform(9, 11))
        rain_mm, rain_chance = 0, 1
        wind = max(wind, 31 + rng.randint(0, 7)); gust = max(gust, wind + 16)
        system = "Hot, dry and windy spell"
    if 7 <= day_index <= 9 and area_index in {0, 1, 5, 9, 10, 11, 14, 17, 18, 20, 25, 27, 29, 30, 33, 35, 36, 39, 40, 41}:
        rain_mm = [52, 96, 78][day_index - 7] + rng.randint(-5, 8)
        rain_chance = 98
        gust = max(gust, 78 + 18 * (day_index == 8))
        wind = max(wind, gust - 20)
        max_c -= 3
        system = "Slow-moving coastal low"
    if 52 <= day_index <= 54 and area_index in INLAND | UPLAND:
        max_c = 40.2 + (day_index - 53) * .7 + rng.uniform(-.4, .6)
        min_c = max(24, max_c - rng.uniform(9, 11))
        rain_mm, rain_chance = 0, 1
        wind = max(wind, 29 + rng.randint(0, 7)); gust = max(gust, wind + 14)
        system = "Heatwave and fire weather"
    if 87 <= day_index <= 90 and area_index in COASTS | RIVERS | LAKES:
        rain_mm = [38, 108, 94, 50][day_index - 87] + rng.randint(-6, 10)
        rain_chance = 99
        gust = max(gust, [78, 116, 102, 74][day_index - 87] + rng.randint(-4, 8))
        wind = max(wind, gust - rng.randint(12, 24)); max_c -= 4
        system = "Tropical low"
    if 130 <= day_index <= 132 and area_index in {5, 10, 11, 18, 27, 29, 33, 36, 40, 41}:
        rain_mm = 55 + rng.randint(-3, 5)
        rain_chance = 96
        gust = max(gust, 48); wind = max(wind, 30)
        system = "Slow-moving river rain band"
    if 176 <= day_index <= 178 and area_index in INLAND | UPLAND:
        max_c = 39 + rng.uniform(-1, 2)
        min_c = max(22, max_c - rng.uniform(9, 12))
        rain_mm, rain_chance = 0, 2
        wind = max(wind, 34 + rng.randint(-2, 6)); gust = max(gust, wind + 17)
        system = "Hot, dry and windy spell"

    if day_index == 112 and profile == "upland":
        max_c = min(max_c, 13); min_c = 1 + (area_index % 2); rain_mm = 0
        system = "Cold mountain air"

    humidity = max(12, min(99, round(78 - max_c * .72 + rain_chance * .27 + rng.randint(-11, 11))))
    if system == "Hot, dry and windy spell" or system == "Heatwave and fire weather":
        humidity = min(humidity, 24)
    if system == "Tropical low":
        humidity = max(humidity, 84)
    uv = max(1, min(12, round((max_c - 11) / 3.3 + rng.uniform(-1.2, 1.4))))
    if rain_mm >= 55: condition = "Thunderstorms" if gust >= 70 else "Rain"
    elif rain_mm >= 9: condition = "Showers"
    elif gust >= 48: condition = "Windy"
    elif rain_chance >= 48: condition = "Partly cloudy"
    elif max_c >= 35 and rain_mm < 2: condition = "Hazy"
    elif rain_chance >= 32: condition = "Cloudy"
    elif rain_chance < 15: condition = "Sunny"
    else: condition = "Mostly sunny"
    if max_c >= 38 and humidity <= 25 and wind >= 30 and rain_mm < 1: fire = "Extreme"
    elif max_c >= 34 and humidity <= 38 and wind >= 24 and rain_mm < 2: fire = "High"
    elif rain_mm < 2 and max_c >= 31: fire = "Moderate"
    else: fire = "Low"
    feels = max_c + min(4, round((humidity - 45) / 20))
    pressure = 1001 if "low" in system.lower() or "rain band" in system.lower() else round(1017 - gust * .12 + rng.uniform(-2, 2), 1)
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    return {"date": date_value.isoformat(), "maxC": round(max_c), "minC": round(min_c), "feelsLikeC": round(feels),
            "condition": condition, "rainMm": round(rain_mm, 1), "rainChance": rain_chance,
            "windKph": wind, "gustKph": gust, "windDirection": directions[(area_index + day_index) % len(directions)],
            "humidity": humidity, "uv": uv, "fireDanger": fire, "pressureHpa": pressure, "system": system}

def main():
    locations = []
    for index, (electorate, town, district, profile) in enumerate(PLACES):
        days = []
        previous_rain = 0
        for day_index in range(COUNT):
            current = START + timedelta(days=day_index)
            daily = day_weather(index, day_index, current, previous_rain)
            days.append(daily)
            previous_rain = daily["rainMm"]
        sunrise_minute = 300 + (index % 7) * 4
        sunset_minute = 1080 + (index % 6) * 3
        def clock(minute):
            hour, minute = divmod(minute, 60)
            return f"{(hour-1)%12+1}:{minute:02d} {'am' if hour<12 else 'pm'}"
        locations.append({"electorate": electorate, "town": town, "district": district, "climate": profile,
                          "code": index + 1, "sunrise": clock(sunrise_minute), "sunset": clock(sunset_minute), "days": days})
    payload = {"service": "Greenwick Meteorological Bureau", "generatedAt": datetime.now(ZoneInfo("America/Belize")).isoformat(), "timeZone": "America/Belize", "startDate": START.isoformat(),
               "cachedDays": COUNT, "locations": locations}
    target = ROOT / "data" / "forecasts-200.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {target} ({len(locations)} electorates × {COUNT} days; {target.stat().st_size:,} bytes).")

if __name__ == "__main__":
    main()
