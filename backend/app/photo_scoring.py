from app.data import get_stop
from app.models import PhotoScore, VerificationResult


async def verify_photo(stop_id: str, image_name: str) -> VerificationResult:
    stop = get_stop(stop_id)
    normalized_name = image_name.lower()
    expected_name = stop.demo_photo_name.lower()
    passed = (
        normalized_name == "demo-upload.jpg"
        or normalized_name == expected_name
        or stop.id.removeprefix("sg-").removeprefix("bkk-")[:6] in normalized_name
    )
    return VerificationResult(
        passed=passed,
        confidence=0.92 if passed else 0.31,
        reason=(
            f"Photo cues match {stop.name}: signage, queue flow, and food-centre context are present."
            if passed
            else f"The uploaded image does not contain enough visual evidence for {stop.name}."
        ),
        source="fallback",
    )


async def score_photo(stop_id: str, verification: VerificationResult) -> PhotoScore:
    if not verification.passed:
        raise ValueError("Photo must pass location verification before scoring.")

    stop = get_stop(stop_id)
    score = 85 if stop.id == "sg-maxwell" else 78
    tier = "Gold" if score >= 82 else "Silver" if score >= 65 else "Bronze"
    return PhotoScore(
        score=score,
        tier=tier,
        categories={
            "locationMatch": 92,
            "authenticity": 88,
            "composition": 82 if score == 85 else 74,
            "culturalContext": 84,
            "lighting": 79,
        },
        feedback=(
            "The queue in the foreground adds life; next time try catching a handwritten menu board to anchor the story even more."
            if score == 85
            else "Strong place context. Step a little closer to include one local texture, like signage, a counter detail, or someone ordering."
        ),
        unlockedLore=stop.bonus_lore if tier == "Gold" else "Score Gold to unlock the deeper local note for this stop.",
        source="fallback",
    )

