import boto3
from botocore.exceptions import ClientError
from backend.config import AWS_REGION, REKOGNITION_COLLECTION_ID

client = boto3.client("rekognition", region_name=AWS_REGION)


def enroll_user_face(image_bytes: bytes, user_id: int) -> str:
    """
    Indexes a face image into the Rekognition collection.
    Returns the FaceId to store in the user's face_image column.
    Raises ValueError if no face is detected.
    """
    response = client.index_faces(
        CollectionId=REKOGNITION_COLLECTION_ID,
        Image={"Bytes": image_bytes},
        ExternalImageId=str(user_id),
        MaxFaces=1,
        QualityFilter="AUTO",
    )

    if not response["FaceRecords"]:
        raise ValueError("No face detected in the provided image")

    return response["FaceRecords"][0]["Face"]["FaceId"]


def identify_user(image_bytes: bytes, threshold: float = 90.0) -> dict:
    """
    Compares a captured photo against all enrolled faces.
    Returns status: "match" | "unknown" | "no_face_detected"
    """
    try:
        response = client.search_faces_by_image(
            CollectionId=REKOGNITION_COLLECTION_ID,
            Image={"Bytes": image_bytes},
            FaceMatchThreshold=threshold,
            MaxFaces=1,
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "InvalidParameterException":
            return {"status": "no_face_detected", "user_id": None}
        raise

    matches = response["FaceMatches"]
    if not matches:
        return {"status": "unknown", "user_id": None}

    best = matches[0]
    return {
        "status": "match",
        "user_id": best["Face"]["ExternalImageId"],
        "similarity": best["Similarity"],
    }
