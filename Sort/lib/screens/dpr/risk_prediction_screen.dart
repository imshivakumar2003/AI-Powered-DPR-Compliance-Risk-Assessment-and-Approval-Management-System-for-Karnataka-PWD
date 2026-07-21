import 'package:flutter/material.dart';
import '../../models/risk_prediction_model.dart';
import '../../services/risk_prediction_service.dart';
import '../../theme/app_theme.dart';

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

  @override
  void initState() {
    super.initState();
    _load();
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

  Color _levelColor(RiskLevel l) {
    switch (l) {
      case RiskLevel.low: return AppTheme.accentGreen;
      case RiskLevel.moderate: return AppTheme.accentAmber;
      case RiskLevel.high: return AppTheme.accentRed;
      case RiskLevel.critical: return const Color(0xFF880E4F);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildOverallCard(),
          const SizedBox(height: 24),
          _buildSectionHeader('Risk Heatmap'),
          const SizedBox(height: 12),
          _buildHeatmapGrid(),
          const SizedBox(height: 24),
          _buildSectionHeader('Category Analysis'),
          const SizedBox(height: 12),
          ..._result!.categorySummaries.map((s) => _buildCategoryTile(s)),
        ],
      ),
    );
  }

  Widget _buildOverallCard() {
    final r = _result!;
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
                    value: r.overallRiskScore,
                    strokeWidth: 6,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation<Color>(_levelColor(r.overallLevel)),
                  ),
                ),
                Text('${(r.overallRiskScore * 100).toInt()}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ],
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Overall Risk: ${r.overallLevel.name.toUpperCase()}', 
                    style: TextStyle(fontWeight: FontWeight.bold, color: _levelColor(r.overallLevel))),
                  Text('${r.allRisks.length} potential risks identified', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeatmapGrid() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: List.generate(5, (r) {
            return Row(
              children: List.generate(5, (c) {
                final cell = _heatmap![4-r][c];
                final hasData = cell.count > 0;
                return Expanded(
                  child: Container(
                    height: 35,
                    margin: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: hasData ? AppTheme.accentRed.withOpacity(0.1 + (r + c) * 0.1) : AppTheme.border.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Center(
                      child: Text(hasData ? '${cell.count}' : '', 
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),
                );
              }),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildCategoryTile(CategoryRiskSummary s) {
    return Card(
      child: ListTile(
        leading: Icon(Icons.category_outlined, color: AppTheme.accentPurple, size: 20),
        title: Text(s.categoryLabel, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        subtitle: Text('${s.totalRisks} risks flagged', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        trailing: Text('${(s.overallRiskScore * 100).toInt()}%', 
          style: TextStyle(fontWeight: FontWeight.bold, color: s.overallRiskScore > 0.6 ? AppTheme.accentRed : AppTheme.accentAmber)),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary));
  }
}
