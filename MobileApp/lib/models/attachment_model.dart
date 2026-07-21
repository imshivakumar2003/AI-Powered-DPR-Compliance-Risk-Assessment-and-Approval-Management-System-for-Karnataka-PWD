//Top Line
/// Model representing an attached file with full path information
class AttachmentModel {
  final String fileName;
  final String filePath;
  final String fileExtension;
  final double fileSizeKB;
  final DateTime uploadedAt;

  AttachmentModel({
    required this.fileName,
    required this.filePath,
    required this.fileExtension,
    required this.fileSizeKB,
    required this.uploadedAt,
  });

  factory AttachmentModel.fromFilePath(String path) {
    final parts = path.replaceAll('\\', '/').split('/');
    final name = parts.last;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : '';
    return AttachmentModel(
      fileName: name,
      filePath: path,
      fileExtension: ext,
      fileSizeKB: 0, // Will be populated when actual file picker is used
      uploadedAt: DateTime.now(),
    );
  }

  String get displaySize {
    if (fileSizeKB >= 1024) {
      return '${(fileSizeKB / 1024).toStringAsFixed(1)} MB';
    }
    return '${fileSizeKB.toStringAsFixed(0)} KB';
  }

  bool get isPdf => fileExtension == 'pdf';
  bool get isImage => ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].contains(fileExtension);
  bool get isSpreadsheet => ['xlsx', 'xls', 'csv'].contains(fileExtension);
  bool get isDocument => ['doc', 'docx', 'txt', 'rtf'].contains(fileExtension);
  bool get isPresentation => ['ppt', 'pptx'].contains(fileExtension);
}
