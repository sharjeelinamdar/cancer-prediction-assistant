from __future__ import annotations

import cv2
import numpy as np


def preprocess_image(image_bgr: np.ndarray) -> np.ndarray:
    """Prepare image for OCR with grayscale conversion and adaptive thresholding."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    denoised = cv2.GaussianBlur(gray, (3, 3), 0)
    thresholded = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        2,
    )
    return thresholded
