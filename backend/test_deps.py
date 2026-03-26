
import sys
import os

try:
    import PyPDF2
    print("PyPDF2 is installed.")
except ImportError:
    print("PyPDF2 is NOT installed.")

try:
    import docx
    print("python-docx is installed.")
except ImportError:
    print("python-docx is NOT installed.")

try:
    import httpx
    print("httpx is installed.")
except ImportError:
    print("httpx is NOT installed.")

try:
    import fastapi
    print("fastapi is installed.")
except ImportError:
    print("fastapi is NOT installed.")
