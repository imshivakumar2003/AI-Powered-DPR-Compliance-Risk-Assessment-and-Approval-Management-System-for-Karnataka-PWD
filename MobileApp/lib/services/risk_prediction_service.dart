import '../models/risk_prediction_model.dart';

/// Service for predicting and analyzing project risks
class RiskPredictionService {
  /// Run risk prediction for a given project.
  /// In production this would call an ML model or rule engine.
  Future<RiskPredictionResult> predictRisks(String projectName) async {
    await Future.delayed(const Duration(milliseconds: 600));

    final risks = getMockRiskData();
    final summaries = _buildCategorySummaries(risks);

    // Overall score = weighted average of category scores
    double totalScore = 0;
    int totalRisks = 0;
    for (final s in summaries) {
      totalScore += s.overallRiskScore * s.totalRisks;
      totalRisks += s.totalRisks;
    }
    final overallScore = totalRisks > 0 ? totalScore / totalRisks : 0.0;
    final overallLevel = _scoreToLevel(overallScore);

    return RiskPredictionResult(
      allRisks: risks,
      categorySummaries: summaries,
      overallRiskScore: overallScore,
      overallLevel: overallLevel,
    );
  }

  /// Build per-category summaries
  List<CategoryRiskSummary> _buildCategorySummaries(List<RiskItem> risks) {
    return RiskCategory.values.map((cat) {
      final catRisks = risks.where((r) => r.category == cat).toList();
      if (catRisks.isEmpty) {
        return CategoryRiskSummary(
          category: cat,
          totalRisks: 0,
          lowCount: 0,
          moderateCount: 0,
          highCount: 0,
          criticalCount: 0,
          averageProbability: 0,
          averageImpact: 0,
          overallRiskScore: 0,
        );
      }

      final low = catRisks.where((r) => r.level == RiskLevel.low).length;
      final mod = catRisks.where((r) => r.level == RiskLevel.moderate).length;
      final high = catRisks.where((r) => r.level == RiskLevel.high).length;
      final crit = catRisks.where((r) => r.level == RiskLevel.critical).length;
      final avgProb = catRisks.map((r) => r.probability).reduce((a, b) => a + b) / catRisks.length;
      final avgImp = catRisks.map((r) => r.impact).reduce((a, b) => a + b) / catRisks.length;
      final avgScore = catRisks.map((r) => r.riskScore).reduce((a, b) => a + b) / catRisks.length;

      return CategoryRiskSummary(
        category: cat,
        totalRisks: catRisks.length,
        lowCount: low,
        moderateCount: mod,
        highCount: high,
        criticalCount: crit,
        averageProbability: avgProb,
        averageImpact: avgImp,
        overallRiskScore: avgScore,
      );
    }).toList();
  }

  /// Convert a 0–1 risk score to a RiskLevel
  RiskLevel _scoreToLevel(double score) {
    if (score >= 0.7) return RiskLevel.critical;
    if (score >= 0.45) return RiskLevel.high;
    if (score >= 0.25) return RiskLevel.moderate;
    return RiskLevel.low;
  }

  /// Build a 5×5 heatmap grid (probability rows × impact columns)
  /// Each cell aggregates risks whose probability & impact fall in that bucket.
  List<List<HeatmapCell>> buildHeatmap(List<RiskItem> risks) {
    // 5 buckets: 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
    List<List<HeatmapCell>> grid = List.generate(5, (pIdx) {
      return List.generate(5, (iIdx) {
        return HeatmapCell(probIndex: pIdx, impactIndex: iIdx, count: 0, risks: []);
      });
    });

    for (final risk in risks) {
      int pIdx = _bucketIndex(risk.probability);
      int iIdx = _bucketIndex(risk.impact);
      final existing = grid[pIdx][iIdx];
      grid[pIdx][iIdx] = HeatmapCell(
        probIndex: pIdx,
        impactIndex: iIdx,
        count: existing.count + 1,
        risks: [...existing.risks, risk],
      );
    }
    return grid;
  }

  int _bucketIndex(double value) {
    if (value >= 0.8) return 4;
    if (value >= 0.6) return 3;
    if (value >= 0.4) return 2;
    if (value >= 0.2) return 1;
    return 0;
  }
}
