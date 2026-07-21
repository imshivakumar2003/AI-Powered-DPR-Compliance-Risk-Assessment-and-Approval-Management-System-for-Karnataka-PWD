class StorageService:
    @staticmethod
    def store_file(file_content: bytes, filename: str) -> str:
        # Dummy implementation
        print(f"Storing file {filename}...")
        return f"stored_path/{filename}"
