import cv2
import sys
import os


if len(sys.argv) < 3:
    print("ERROR: Input और output path चाहिए।")
    sys.exit(1)


input_path = sys.argv[1]
output_path = sys.argv[2]


if not os.path.isfile(input_path):
    print("ERROR: Photo नहीं मिली:", input_path)
    sys.exit(1)


image = cv2.imread(input_path)


if image is None:
    print("ERROR: Image open नहीं हो सकी।")
    sys.exit(1)


height, width = image.shape[:2]


model_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "face_detection_yunet_2023mar.onnx"
)


if not os.path.isfile(model_path):
    print("ERROR: YuNet model नहीं मिली.")
    sys.exit(1)


detector = cv2.FaceDetectorYN.create(
    model_path,
    "",
    (width, height),
    0.35,
    0.30,
    5000
)


detector.setInputSize(
    (width, height)
)


_, faces = detector.detect(image)


if faces is None:
    faces = []


print(
    "Detected faces:",
    len(faces)
)


for index, face in enumerate(faces):

    x = int(face[0])
    y = int(face[1])
    w = int(face[2])
    h = int(face[3])


    # Small rectangle
    px = int(w * 0.08)
    py = int(h * 0.08)


    x1 = max(
        0,
        x + px
    )

    y1 = max(
        0,
        y + py
    )

    x2 = min(
        width,
        x + w - px
    )

    y2 = min(
        height,
        y + h - py
    )


    if x2 <= x1 or y2 <= y1:
        continue


    region = image[
        y1:y2,
        x1:x2
    ]


    blurred = cv2.GaussianBlur(
        region,
        (0, 0),
        sigmaX=25,
        sigmaY=25
    )


    image[
        y1:y2,
        x1:x2
    ] = blurred


    print(
        "Blurred face",
        index + 1
    )


success = cv2.imwrite(
    output_path,
    image,
    [
        cv2.IMWRITE_JPEG_QUALITY,
        88
    ]
)


if not success:

    print(
        "ERROR: Output save नहीं हुई।"
    )

    sys.exit(1)


print("SUCCESS")
print(
    "Blurred image:",
    output_path
)