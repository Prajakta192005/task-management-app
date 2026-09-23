

import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv


load_dotenv()


GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def send_email(to_email, subject, body):
    if not GMAIL_EMAIL or not GMAIL_APP_PASSWORD:
        raise ValueError(
            "GMAIL_EMAIL and GMAIL_APP_PASSWORD must be configured"
        )

    message = MIMEMultipart()

    message["From"] = GMAIL_EMAIL
    message["To"] = to_email
    message["Subject"] = subject

    message.attach(
        MIMEText(body, "plain")
    )

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()

        server.login(
            GMAIL_EMAIL,
            GMAIL_APP_PASSWORD
        )

        server.sendmail(
            GMAIL_EMAIL,
            to_email,
            message.as_string()
        )