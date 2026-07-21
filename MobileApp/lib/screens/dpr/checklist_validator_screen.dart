import 'package:flutter/material.dart';
import '../../models/checklist_model.dart';
import '../../services/checklist_service.dart';

/// Checklist Validator widget — designed to be embedded inside the DPR Dashboard TabBarView.
/// Features: summary header, filter toggles, grouped checklist with auto-flagged highlighting,
/// and expandable detail panels for flagged items.
class ChecklistValidatorWidget extends StatefulWidget {
  final String projectName;

  const ChecklistValidatorWidget({Key? key, required this.projectName}) : super(key: key);

  @override
  State<ChecklistValidatorWidget> createState() => _ChecklistValidatorWidgetState();
}

class _ChecklistValidatorWidgetState extends State<ChecklistValidatorWidget>
    with SingleTickerProviderStateMixin {
  final ChecklistService _service = ChecklistService();

  List<ChecklistCategory> _categories = [];
  ChecklistSummary? _summary;
  bool _isLoading = true;

  // Filter: 0 = All, 1 = Flagged Only, 2 = Passed Only
  int _filterIndex = 0;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _loadChecklist();
  }

  @override
  void didUpdateWidget(covariant ChecklistValidatorWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.projectName != widget.projectName) {
      _loadChecklist();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
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

  // ─── Colors ──────────────────────────────────────────────
  Color _severityColor(ChecklistSeverity s) {
    switch (s) {
      case ChecklistSeverity.critical:
        return const Color(0xFFD32F2F);
      case ChecklistSeverity.warning:
        return const Color(0xFFF57C00);
      case ChecklistSeverity.info:
        return const Color(0xFF1976D2);
    }
  }

  Color _severityBg(ChecklistSeverity s) {
    switch (s) {
      case ChecklistSeverity.critical:
        return const Color(0xFFFFEBEE);
      case ChecklistSeverity.warning:
        return const Color(0xFFFFF3E0);
      case ChecklistSeverity.info:
        return const Color(0xFFE3F2FD);
    }
  }

  IconData _severityIcon(ChecklistSeverity s) {
    switch (s) {
      case ChecklistSeverity.critical:
        return Icons.error;
      case ChecklistSeverity.warning:
        return Icons.warning_amber_rounded;
      case ChecklistSeverity.info:
        return Icons.info_outline;
    }
  }

  String _severityLabel(ChecklistSeverity s) {
    switch (s) {
      case ChecklistSeverity.critical:
        return 'CRITICAL';
      case ChecklistSeverity.warning:
        return 'WARNING';
      case ChecklistSeverity.info:
        return 'INFO';
    }
  }

  // ─── Filtered items ──────────────────────────────────────
  List<ChecklistItem> _filteredItems(List<ChecklistItem> items) {
    switch (_filterIndex) {
      case 1:
        return items.where((i) => !i.isPassed).toList();
      case 2:
        return items.where((i) => i.isPassed).toList();
      default:
        return items;
    }
  }

  // ─── Build ────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Running validation checks…',
                style: TextStyle(color: Colors.grey, fontSize: 14)),
          ],
        ),
      );
    }

    if (_summary == null) return const SizedBox.shrink();

    return RefreshIndicator(
      onRefresh: _loadChecklist,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSummaryCard(),
            const SizedBox(height: 14),
            _buildFilterBar(),
            const SizedBox(height: 14),
            ..._categories.map((cat) {
              final items = _filteredItems(cat.items);
              if (items.isEmpty) return const SizedBox.shrink();
              return _buildCategorySection(cat, items);
            }),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  SUMMARY CARD
  // ═══════════════════════════════════════════════════════════
  Widget _buildSummaryCard() {
    final s = _summary!;
    final passRate = s.passRate;
    final statusOk = !s.hasIssues;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: statusOk
                ? [const Color(0xFFE8F5E9), Colors.white]
                : [const Color(0xFFFFF8E1), Colors.white],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                // Circular progress
                SizedBox(
                  width: 80,
                  height: 80,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 80,
                        height: 80,
                        child: CircularProgressIndicator(
                          value: passRate,
                          strokeWidth: 8,
                          backgroundColor: Colors.grey[200],
                          color: passRate >= 0.8
                              ? Colors.green
                              : passRate >= 0.6
                                  ? Colors.orange
                                  : Colors.red,
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${s.passedItems}/${s.totalItems}',
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          Text('passed',
                              style: TextStyle(
                                  fontSize: 10, color: Colors.grey[600])),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                // Status & counts
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: statusOk
                              ? Colors.green.withOpacity(0.15)
                              : s.hasCritical
                                  ? Colors.red.withOpacity(0.15)
                                  : Colors.orange.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              statusOk
                                  ? Icons.check_circle
                                  : s.hasCritical
                                      ? Icons.error
                                      : Icons.warning_amber_rounded,
                              size: 18,
                              color: statusOk
                                  ? Colors.green[700]
                                  : s.hasCritical
                                      ? Colors.red[700]
                                      : Colors.orange[700],
                            ),
                            const SizedBox(width: 6),
                            Text(
                              statusOk ? 'All Clear' : 'Issues Found',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: statusOk
                                    ? Colors.green[700]
                                    : s.hasCritical
                                        ? Colors.red[700]
                                        : Colors.orange[700],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildSeverityChip(
                              'Critical', s.criticalCount, ChecklistSeverity.critical),
                          const SizedBox(width: 8),
                          _buildSeverityChip(
                              'Warning', s.warningCount, ChecklistSeverity.warning),
                          const SizedBox(width: 8),
                          _buildSeverityChip(
                              'Info', s.infoCount, ChecklistSeverity.info),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: passRate,
                minHeight: 10,
                backgroundColor: Colors.grey[200],
                color: passRate >= 0.8
                    ? Colors.green
                    : passRate >= 0.6
                        ? Colors.orange
                        : Colors.red,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${(passRate * 100).toStringAsFixed(1)}% compliance',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text('${s.failedItems} issue(s) to resolve',
                    style: TextStyle(
                        fontSize: 12,
                        color: s.failedItems > 0
                            ? Colors.red[600]
                            : Colors.green[600],
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSeverityChip(String label, int count, ChecklistSeverity severity) {
    final color = _severityColor(severity);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_severityIcon(severity), size: 14, color: color),
          const SizedBox(width: 4),
          Text('$count',
              style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  FILTER BAR
  // ═══════════════════════════════════════════════════════════
  Widget _buildFilterBar() {
    final labels = ['All Items', 'Flagged Only', 'Passed Only'];
    final icons = [Icons.list_alt, Icons.flag, Icons.check_circle_outline];

    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: List.generate(3, (i) {
          final selected = _filterIndex == i;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _filterIndex = i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 8,
                              offset: const Offset(0, 2))
                        ]
                      : [],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icons[i],
                        size: 16,
                        color: selected
                            ? Colors.purple[700]
                            : Colors.grey[500]),
                    const SizedBox(width: 6),
                    Text(
                      labels[i],
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight:
                            selected ? FontWeight.w700 : FontWeight.w500,
                        color: selected
                            ? Colors.purple[700]
                            : Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  CATEGORY SECTION
  // ═══════════════════════════════════════════════════════════
  Widget _buildCategorySection(
      ChecklistCategory category, List<ChecklistItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 8),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 22,
                decoration: BoxDecoration(
                  color: Colors.purple[700],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  category.name,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.purple[800],
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: category.failedItems > 0
                      ? Colors.red[50]
                      : Colors.green[50],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${category.passedItems}/${category.totalItems}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: category.failedItems > 0
                        ? Colors.red[700]
                        : Colors.green[700],
                  ),
                ),
              ),
            ],
          ),
        ),
        ...items.map((item) => _buildChecklistItemCard(item)),
        const SizedBox(height: 8),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  CHECKLIST ITEM CARD
  // ═══════════════════════════════════════════════════════════
  Widget _buildChecklistItemCard(ChecklistItem item) {
    if (item.isPassed) {
      return _buildPassedItemCard(item);
    } else {
      return _buildFlaggedItemCard(item);
    }
  }

  /// Simple non-expandable card for passed items
  Widget _buildPassedItemCard(ChecklistItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: Colors.green.withOpacity(0.25)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.green.withOpacity(0.12),
              ),
              child: const Icon(Icons.check_circle,
                  color: Colors.green, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.title,
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text(item.id,
                      style: TextStyle(
                          fontSize: 11, color: Colors.grey[500])),
                ],
              ),
            ),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('PASSED',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Colors.green)),
            ),
          ],
        ),
      ),
    );
  }

  /// Expandable card for flagged items with detail panel
  Widget _buildFlaggedItemCard(ChecklistItem item) {
    final color = _severityColor(item.severity);
    final bgColor = _severityBg(item.severity);
    final isCritical = item.severity == ChecklistSeverity.critical;

    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Card(
          margin: const EdgeInsets.only(bottom: 6),
          elevation: isCritical ? 2 : 1,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(
              color: isCritical
                  ? color.withOpacity(0.3 + _pulseAnimation.value * 0.3)
                  : color.withOpacity(0.35),
              width: isCritical ? 1.5 : 1,
            ),
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              color: isCritical
                  ? bgColor.withOpacity(0.5 + _pulseAnimation.value * 0.3)
                  : bgColor.withOpacity(0.5),
            ),
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                childrenPadding: EdgeInsets.zero,
                leading: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withOpacity(0.15),
                  ),
                  child: Icon(_severityIcon(item.severity),
                      color: color, size: 20),
                ),
                title: Text(item.title,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Row(
                    children: [
                      Text(item.id,
                          style: TextStyle(
                              fontSize: 11, color: Colors.grey[500])),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _severityLabel(item.severity),
                          style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: color,
                              letterSpacing: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
                trailing: Icon(Icons.expand_more, color: color, size: 22),
                children: [
                  _buildDetailPanel(item),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Expanded detail panel inside a flagged item
  Widget _buildDetailPanel(ChecklistItem item) {
    final color = _severityColor(item.severity);
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 0, 14, 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDetailRow(
            icon: Icons.description_outlined,
            label: 'Description',
            content: item.description,
            color: Colors.grey[700]!,
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),
          _buildDetailRow(
            icon: Icons.search,
            label: 'Evidence',
            content: item.evidence,
            color: color,
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),
          _buildDetailRow(
            icon: Icons.lightbulb_outline,
            label: 'Recommendation',
            content: item.recommendation,
            color: Colors.green[700]!,
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String content,
    required Color color,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Colors.grey[500],
                      letterSpacing: 0.3)),
              const SizedBox(height: 4),
              Text(content,
                  style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[800],
                      height: 1.4)),
            ],
          ),
        ),
      ],
    );
  }
}
