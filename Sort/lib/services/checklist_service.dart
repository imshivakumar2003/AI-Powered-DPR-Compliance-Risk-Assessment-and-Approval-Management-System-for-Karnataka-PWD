import '../models/checklist_model.dart';

/// Service class for validating DPR checklists
class ChecklistService {
  /// Validates a DPR and returns categorized checklist results.
  /// In a real app, this would call an API or run rule-based validation.
  Future<List<ChecklistCategory>> validateDpr(String projectName) async {
    // Simulate network/processing delay
    await Future.delayed(const Duration(milliseconds: 800));
    return getMockChecklistData();
  }

  /// Computes aggregate summary statistics from a list of categories
  ChecklistSummary getSummary(List<ChecklistCategory> categories) {
    int total = 0;
    int passed = 0;
    int failed = 0;
    int critical = 0;
    int warning = 0;
    int info = 0;

    for (final category in categories) {
      for (final item in category.items) {
        total++;
        if (item.isPassed) {
          passed++;
        } else {
          failed++;
          switch (item.severity) {
            case ChecklistSeverity.critical:
              critical++;
              break;
            case ChecklistSeverity.warning:
              warning++;
              break;
            case ChecklistSeverity.info:
              info++;
              break;
          }
        }
      }
    }

    return ChecklistSummary(
      totalItems: total,
      passedItems: passed,
      failedItems: failed,
      criticalCount: critical,
      warningCount: warning,
      infoCount: info,
    );
  }
}
