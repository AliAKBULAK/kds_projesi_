import random
import json
from datetime import datetime

# Mock Data Generator for Hotel KDS
# Generates dummy daily data for testing

def generate_daily_data():
    day = datetime.now().strftime("%Y-%m-%d")
    occupancy = random.randint(30, 100)
    avg_price = random.randint(2000, 5000)
    income = occupancy * avg_price
    
    data = {
        "date": day,
        "occupancy_rate": occupancy,
        "average_room_price": avg_price,
        "daily_income": income,
        "department_expenses": {
            "kitchen": random.randint(5000, 20000),
            "housekeeping": random.randint(3000, 10000)
        }
    }
    return data

if __name__ == "__main__":
    print("Generating Mock Data...")
    print(json.dumps(generate_daily_data(), indent=2))
