#!/usr/bin/env python3
import os
import sys
import ftplib
import base64
import xml.etree.ElementTree as ET
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "dist"
XML_CONFIG = ROOT_DIR / "franchoil.xml"
REMOTE_TARGET_DIR = "/domains/franchglobal.com/public_html"

def load_ftp_credentials():
    if not XML_CONFIG.exists():
        print(f"Error: {XML_CONFIG} not found.")
        sys.exit(1)

    tree = ET.parse(XML_CONFIG)
    root = tree.getroot()
    server = root.find(".//Server")
    if server is None:
        print("Error: Could not find <Server> in XML.")
        sys.exit(1)

    host = server.findtext("Host", "145.79.58.39")
    port = int(server.findtext("Port", "21"))
    user = server.findtext("User", "u157995270")
    pass_b64 = server.findtext("Pass", "")
    password = base64.b64decode(pass_b64).decode("utf-8") if pass_b64 else ""

    return host, port, user, password

def ensure_remote_dir(ftp, remote_dir):
    parts = remote_dir.strip("/").split("/")
    current = ""
    for part in parts:
        current += f"/{part}"
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(current)
                ftp.cwd(current)
            except ftplib.error_perm:
                pass

def upload_directory(ftp, local_dir, remote_base, dry_run=False):
    total_files = 0
    uploaded_files = 0
    local_dir = Path(local_dir)

    all_files = [p for p in local_dir.rglob("*") if p.is_file()]
    total_files = len(all_files)
    print(f"Found {total_files} files in {local_dir} to deploy.")

    for idx, local_path in enumerate(all_files, 1):
        rel_path = local_path.relative_to(local_dir)
        remote_path = f"{remote_base}/{rel_path.as_posix()}"
        remote_folder = str(Path(remote_path).parent).replace("\\", "/")

        if dry_run:
            print(f"[DRY RUN] [{idx}/{total_files}] Would upload: {rel_path} -> {remote_path}")
            continue

        ensure_remote_dir(ftp, remote_folder)
        ftp.cwd(remote_folder)

        filename = local_path.name
        with open(local_path, "rb") as f:
            try:
                ftp.storbinary(f"STOR {filename}", f)
                uploaded_files += 1
                if idx % 10 == 0 or idx == total_files:
                    print(f"[{idx}/{total_files}] Uploaded: {rel_path}")
            except Exception as e:
                print(f"! Failed to upload {rel_path}: {e}")

    print(f"\nDone! Successfully deployed {uploaded_files}/{total_files} files.")

def main():
    dry_run = "--dry-run" in sys.argv

    if not DIST_DIR.exists():
        print(f"Error: {DIST_DIR} not found. Please run 'npm run build' first.")
        sys.exit(1)

    host, port, user, password = load_ftp_credentials()
    print(f"Connecting to FTP {host}:{port} as {user}...")

    ftp = ftplib.FTP()
    ftp.connect(host, port, timeout=30)
    ftp.login(user, password)
    print("Logged in successfully!")

    try:
        ensure_remote_dir(ftp, REMOTE_TARGET_DIR)
        print(f"Target directory verified: {REMOTE_TARGET_DIR}")
        upload_directory(ftp, DIST_DIR, REMOTE_TARGET_DIR, dry_run=dry_run)
    finally:
        try:
            ftp.quit()
        except Exception:
            pass

if __name__ == "__main__":
    main()

