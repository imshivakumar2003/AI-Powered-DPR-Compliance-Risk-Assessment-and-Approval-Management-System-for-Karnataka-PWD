import 'package:flutter/material.dart';
import '../../models/risk_prediction_model.dart';
import '../../services/risk_prediction_service.dart';

/// Risk Prediction Module widget — embedded in DPR Dashboard TabBarView.
/// Features: category-wise risk prediction, heatmap visualization,
/// probability and impact charts.
class RiskPredictionWidget extends StatefulWidget {
  final String projectName;
  const RiskPredictionWidget({Key? key, required this.projectName}) : super(key: key);

  @override
  State<RiskPredictionWidget> createState() => _RiskPredictionWidgetState();
}

class _RiskPredictionWidgetState extends State<RiskPredictionWidget> {
  final RiskPredictionService _service = RiskPredictionService();
  RiskPredictionResult? _result;
  List<List<HeatmapCell>>? _heatmap;
  bool _isLoading = true;
  RiskCategory? _selectedCategory; // null = all

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant RiskPredictionWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.projectName != widget.projectName) _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final result = await _service.predictRisks(widget.projectName);
    final heatmap = _service.buildHeatmap(result.allRisks);
    setState(() {
      _result = result;
      _heatmap = heatmap;
      _isLoading = false;
    });
  }

  List<RiskItem> get _filteredRisks {
    if (_result == null) return [];
    if (_selectedCategory == null) return _result!.allRisks;
    return _result!.allRisks.where((r) => r.category == _selectedCategory).toList();
  }

  // ─── Colors ───
  Color _levelColor(RiskLevel l) {
    switch (l) {
      case RiskLevel.low: return const Color(0xFF43A047);
      case RiskLevel.moderate: return const Color(0xFFFB8C00);
      case RiskLevel.high: return const Color(0xFFE53935);
      case RiskLevel.critical: return const Color(0xFF880E4F);
    }
  }

  Color _catColor(RiskCategory c) {
    switch (c) {
      case RiskCategory.financial: return const Color(0xFF1565C0);
      case RiskCategory.technical: return const Color(0xFF6A1B9A);
      case RiskCategory.environmental: return const Color(0xFF2E7D32);
    }
  }

  IconData _catIcon(RiskCategory c) {
    switch (c) {
      case RiskCategory.financial: return Icons.account_balance;
      case RiskCategory.technical: return Icons.memory;
      case RiskCategory.environmental: return Icons.eco;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [CircularProgressIndicator(), SizedBox(height: 16),
          Text('Analyzing risks…', style: TextStyle(color: Colors.grey, fontSize: 14))],
      ));
    }
    if (_result == null) return const SizedBox.shrink();

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _buildOverallCard(),
          const SizedBox(height: 14),
          _buildCategoryCards(),
          const SizedBox(height: 14),
          _sectionTitle('Risk Heatmap (Probability × Impact)'),
          const SizedBox(height: 8),
          _buildHeatmap(),
          const SizedBox(height: 18),
          _sectionTitle('Probability & Impact Chart'),
          const SizedBox(height: 8),
          _buildDualBarChart(),
          const SizedBox(height: 18),
          _buildCategoryFilter(),
          const SizedBox(height: 10),
          _sectionTitle('Risk Details'),
          const SizedBox(height: 8),
          ..._filteredRisks.map(_buildRiskCard),
        ]),
      ),
    );
  }

  Widget _sectionTitle(String t) => Text(t,
      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.purple[800]));

  // ═══════════════ OVERALL CARD ═══════════════
  Widget _buildOverallCard() {
    final r = _result!;
    final score = r.overallRiskScore;
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [_levelColor(r.overallLevel).withOpacity(0.08), Colors.white],
            begin: Alignment.topLeft, end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Row(children: [
          SizedBox(width: 76, height: 76, child: Stack(alignment: Alignment.center, children: [
            SizedBox(width: 76, height: 76, child: CircularProgressIndicator(
              value: score, strokeWidth: 7, backgroundColor: Colors.grey[200],
              color: _levelColor(r.overallLevel),
            )),
            Text('${(score * 100).toInt()}%', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: _levelColor(r.overallLevel))),
          ])),
          const SizedBox(width: 18),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: _levelColor(r.overallLevel).withOpacity(0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text('Overall: ${r.overallLevel == RiskLevel.critical ? "CRITICAL" : r.overallLevel == RiskLevel.high ? "HIGH" : r.overallLevel == RiskLevel.moderate ? "MODERATE" : "LOW"}',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: _levelColor(r.overallLevel))),
            ),
            const SizedBox(height: 10),
            Text('${r.allRisks.length} risks identified across ${r.categorySummaries.length} categories',
              style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          ])),
        ]),
      ),
    );
  }

  // ═══════════════ CATEGORY CARDS ═══════════════
  Widget _buildCategoryCards() {
    return Row(
      children: _result!.categorySummaries.map((s) {
        final color = _catColor(s.category);
        return Expanded(child: Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(padding: const EdgeInsets.all(12), child: Column(children: [
            Icon(_catIcon(s.category), color: color, size: 26),
            const SizedBox(height: 6),
            Text(s.categoryLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
            const SizedBox(height: 4),
            Text('${(s.overallRiskScore * 100).toInt()}%', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text('${s.totalRisks} risks', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
            const SizedBox(height: 6),
            // Mini level bars
            Row(children: [
              _miniBar(s.criticalCount, Colors.pink[800]!),
              _miniBar(s.highCount, Colors.red),
              _miniBar(s.moderateCount, Colors.orange),
              _miniBar(s.lowCount, Colors.green),
            ]),
          ])),
        ));
      }).toList(),
    );
  }

  Widget _miniBar(int count, Color color) {
    return Expanded(child: Container(
      height: 4, margin: const EdgeInsets.symmetric(horizontal: 1),
      decoration: BoxDecoration(
        color: count > 0 ? color : Colors.grey[200],
        borderRadius: BorderRadius.circular(2),
      ),
    ));
  }

  // ═══════════════ HEATMAP ═══════════════
  Widget _buildHeatmap() {
    if (_heatmap == null) return const SizedBox.shrink();
    final labels = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'];

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(padding: const EdgeInsets.all(14), child: Column(children: [
        // Grid: rows = probability (top=high), cols = impact
        ...List.generate(5, (rowIdx) {
          final pIdx = 4 - rowIdx; // flip so high prob is on top
          return Row(children: [
            SizedBox(width: 44, child: Text(labels[pIdx], style: TextStyle(fontSize: 9, color: Colors.grey[600]), textAlign: TextAlign.right)),
            const SizedBox(width: 6),
            ...List.generate(5, (iIdx) {
              final cell = _heatmap![pIdx][iIdx];
              final intensity = (pIdx + iIdx) / 8.0; // 0..1
              final color = Color.lerp(const Color(0xFFC8E6C9), const Color(0xFFB71C1C), intensity)!;
              return Expanded(child: GestureDetector(
                onTap: cell.count > 0 ? () => _showCellRisks(cell) : null,
                child: Container(
                  height: 40, margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: cell.count > 0 ? color : Colors.grey[100],
                    borderRadius: BorderRadius.circular(6),
                    border: cell.count > 0 ? Border.all(color: color.withOpacity(0.6), width: 1) : null,
                  ),
                  child: Center(child: Text(
                    cell.count > 0 ? '${cell.count}' : '',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: intensity > 0.5 ? Colors.white : Colors.grey[800]),
                  )),
                ),
              ));
            }),
          ]);
        }),
        const SizedBox(height: 4),
        // Impact labels
        Row(children: [
          const SizedBox(width: 50),
          ...labels.map((l) => Expanded(child: Text(l, textAlign: TextAlign.center, style: TextStyle(fontSize: 9, color: Colors.grey[600])))),
        ]),
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text('← Probability (Y)', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
          const SizedBox(width: 20),
          Text('Impact (X) →', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
        ]),
        const SizedBox(height: 8),
        // Legend
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _legendDot(const Color(0xFFC8E6C9), 'Low'),
          _legendDot(const Color(0xFFFFF176), 'Moderate'),
          _legendDot(const Color(0xFFEF5350), 'High'),
          _legendDot(const Color(0xFFB71C1C), 'Critical'),
        ]),
      ])),
    );
  }

  Widget _legendDot(Color c, String label) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 6),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 10, height: 10, decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(3))),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
    ]),
  );

  void _showCellRisks(HeatmapCell cell) {
    showModalBottomSheet(context: context, shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ), builder: (ctx) => Padding(
      padding: const EdgeInsets.all(16),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Risks in this cell', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.purple[800])),
        const SizedBox(height: 12),
        ...cell.risks.map((r) => ListTile(
          dense: true,
          leading: Icon(_catIcon(r.category), color: _catColor(r.category), size: 22),
          title: Text(r.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          subtitle: Text('P: ${(r.probability * 100).toInt()}% | I: ${(r.impact * 100).toInt()}%', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: _levelColor(r.level).withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
            child: Text(r.levelLabel, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _levelColor(r.level))),
          ),
        )),
      ]),
    ));
  }

  // ═══════════════ DUAL BAR CHART ═══════════════
  Widget _buildDualBarChart() {
    final risks = _result!.allRisks;
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(padding: const EdgeInsets.all(14), child: Column(children: [
        SizedBox(height: 220, child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: List.generate(risks.length, (i) {
            final r = risks[i];
            return Expanded(child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 1),
              child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                // Probability bar
                Container(
                  height: r.probability * 180,
                  width: 8,
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.7),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                  ),
                ),
                const SizedBox(height: 2),
                // Impact bar
                Container(
                  height: r.impact * 180,
                  width: 8,
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.7),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                  ),
                ),
              ]),
            ));
          }),
        )),
        const SizedBox(height: 6),
        // ID labels
        Row(children: risks.map((r) => Expanded(
          child: Text(r.id.split('-').last, textAlign: TextAlign.center, style: TextStyle(fontSize: 7, color: Colors.grey[500])),
        )).toList()),
        const SizedBox(height: 10),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(width: 12, height: 8, decoration: BoxDecoration(color: Colors.blue.withOpacity(0.7), borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 4),
          Text('Probability', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
          const SizedBox(width: 16),
          Container(width: 12, height: 8, decoration: BoxDecoration(color: Colors.red.withOpacity(0.7), borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 4),
          Text('Impact', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
        ]),
      ])),
    );
  }

  // ═══════════════ CATEGORY FILTER ═══════════════
  Widget _buildCategoryFilter() {
    return Container(
      decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(12)),
      padding: const EdgeInsets.all(4),
      child: Row(children: [
        _filterChip('All', null),
        _filterChip('Financial', RiskCategory.financial),
        _filterChip('Technical', RiskCategory.technical),
        _filterChip('Environ.', RiskCategory.environmental),
      ]),
    );
  }

  Widget _filterChip(String label, RiskCategory? cat) {
    final selected = _selectedCategory == cat;
    return Expanded(child: GestureDetector(
      onTap: () => setState(() => _selectedCategory = cat),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: selected ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6, offset: const Offset(0, 2))] : [],
        ),
        child: Text(label, textAlign: TextAlign.center, style: TextStyle(
          fontSize: 12, fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? Colors.purple[700] : Colors.grey[600],
        )),
      ),
    ));
  }

  // ═══════════════ RISK DETAIL CARD ═══════════════
  Widget _buildRiskCard(RiskItem risk) {
    final color = _levelColor(risk.level);
    final catColor = _catColor(risk.category);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: color.withOpacity(0.3)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          childrenPadding: EdgeInsets.zero,
          leading: Container(
            width: 28, height: 28,
            decoration: BoxDecoration(shape: BoxShape.circle, color: catColor.withOpacity(0.12)),
            child: Icon(_catIcon(risk.category), color: catColor, size: 16),
          ),
          title: Text(risk.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(children: [
              Text(risk.id, style: TextStyle(fontSize: 10, color: Colors.grey[500])),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(4)),
                child: Text(risk.levelLabel.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color)),
              ),
              const SizedBox(width: 6),
              Text('P:${(risk.probability * 100).toInt()}% I:${(risk.impact * 100).toInt()}%',
                style: TextStyle(fontSize: 10, color: Colors.grey[500])),
            ]),
          ),
          trailing: SizedBox(
            width: 36, height: 36,
            child: Stack(alignment: Alignment.center, children: [
              CircularProgressIndicator(value: risk.riskScore, strokeWidth: 3, backgroundColor: Colors.grey[200], color: color),
              Text('${(risk.riskScore * 100).toInt()}', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
            ]),
          ),
          children: [_buildRiskDetail(risk)],
        ),
      ),
    );
  }

  Widget _buildRiskDetail(RiskItem risk) {
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 0, 14, 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey[50], borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.withOpacity(0.15)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _detailRow(Icons.description_outlined, 'Description', risk.description, Colors.grey[700]!),
        const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(height: 1)),
        _detailRow(Icons.bolt, 'Trigger', risk.trigger, Colors.orange[700]!),
        const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(height: 1)),
        _detailRow(Icons.shield_outlined, 'Mitigation', risk.mitigation, Colors.green[700]!),
      ]),
    );
  }

  Widget _detailRow(IconData icon, String label, String content, Color color) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(7)),
        child: Icon(icon, size: 15, color: color),
      ),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.grey[500], letterSpacing: 0.3)),
        const SizedBox(height: 3),
        Text(content, style: TextStyle(fontSize: 12, color: Colors.grey[800], height: 1.4)),
      ])),
    ]);
  }
}
