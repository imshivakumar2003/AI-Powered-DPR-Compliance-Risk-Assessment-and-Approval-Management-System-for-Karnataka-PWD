import 'package:flutter/material.dart';
import '../../models/checklist_model.dart';
import '../../services/checklist_service.dart';
import '../../theme/app_theme.dart';

class ChecklistValidatorWidget extends StatefulWidget {
  final String projectName;
  const ChecklistValidatorWidget({Key? key, required this.projectName}) : super(key: key);

  @override
  State<ChecklistValidatorWidget> createState() => _ChecklistValidatorWidgetState();
}

class _ChecklistValidatorWidgetState extends State<ChecklistValidatorWidget> {
  final ChecklistService _service = ChecklistService();
  List<ChecklistCategory> _categories = [];
  ChecklistSummary? _summary;
  bool _isLoading = true;
  int _filterIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadChecklist();
  }

  Future<void> _loadChecklist() async {
    setState(() => _isLoading = true);
    final categories = await _service.validateDpr(widget.projectName);
    final summary = _service.getSummary(categories);
    setState(() {
      _categories = categories;
      _summary = summary;
      _isLoading = false;
    });
  }

  Color _severityColor(ChecklistSeverity s) {
    switch (s) {
      case ChecklistSeverity.critical: return AppTheme.accentRed;
      case ChecklistSeverity.warning: return AppTheme.accentAmber;
      case ChecklistSeverity.info: return AppTheme.accentBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildSummaryCard(),
          const SizedBox(height: 16),
          _buildFilterBar(),
          const SizedBox(height: 16),
          ..._categories.map((cat) => _buildCategorySection(cat)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    final s = _summary!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 60, height: 60,
                  child: CircularProgressIndicator(
                    value: s.passRate,
                    strokeWidth: 6,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation<Color>(s.passRate > 0.7 ? AppTheme.accentGreen : AppTheme.accentRed),
                  ),
                ),
                Text('${(s.passRate * 100).toInt()}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ],
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.hasIssues ? 'Issues Detected' : 'All Checks Passed', 
                    style: TextStyle(fontWeight: FontWeight.bold, color: s.hasIssues ? AppTheme.accentAmber : AppTheme.accentGreen)),
                  Text('${s.passedItems}/${s.totalItems} parameters verified', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _filterChip('All', 0),
        _filterChip('Flagged', 1),
        _filterChip('Passed', 2),
      ],
    );
  }

  Widget _filterChip(String label, int index) {
    final isSelected = _filterIndex == index;
    return ChoiceChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      selected: isSelected,
      onSelected: (val) => setState(() => _filterIndex = index),
      selectedColor: AppTheme.accentBlue.withOpacity(0.2),
    );
  }

  Widget _buildCategorySection(ChecklistCategory cat) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(cat.name, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentBlue, fontSize: 14)),
        ),
        ...cat.items.map((item) => _buildItemCard(item)),
      ],
    );
  }

  Widget _buildItemCard(ChecklistItem item) {
    final color = item.isPassed ? AppTheme.accentGreen : _severityColor(item.severity);
    return Card(
      child: ListTile(
        leading: Icon(item.isPassed ? Icons.check_circle_outline : Icons.error_outline, color: color, size: 20),
        title: Text(item.title, style: const TextStyle(fontSize: 13)),
        subtitle: Text(item.id, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        trailing: item.isPassed 
            ? const Icon(Icons.chevron_right, size: 16, color: AppTheme.textMuted)
            : Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                child: Text('FLAGGED', style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.bold)),
              ),
      ),
    );
  }
}
