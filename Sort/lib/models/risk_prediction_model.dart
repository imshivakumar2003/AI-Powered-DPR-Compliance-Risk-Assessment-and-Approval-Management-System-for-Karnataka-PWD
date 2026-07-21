/// Risk categories for DPR risk prediction
enum RiskCategory { financial, technical, environmental }

/// Risk level classification
enum RiskLevel { low, moderate, high, critical }

/// A single predicted risk item within a category
class RiskItem {
  final String id;
  final String title;
  final String description;
  final RiskCategory category;
  final RiskLevel level;
  final double probability; // 0.0 to 1.0
  final double impact; // 0.0 to 1.0 (severity of consequence)
  final String mitigation;
  final String trigger; // What would cause this risk to materialize

  const RiskItem({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.level,
    required this.probability,
    required this.impact,
    this.mitigation = '',
    this.trigger = '',
  });

  /// Risk score = probability × impact (0.0 to 1.0)
  double get riskScore => probability * impact;

  /// Human-readable risk level label
  String get levelLabel {
    switch (level) {
      case RiskLevel.low:
        return 'Low';
      case RiskLevel.moderate:
        return 'Moderate';
      case RiskLevel.high:
        return 'High';
      case RiskLevel.critical:
        return 'Critical';
    }
  }

  /// Human-readable category label
  String get categoryLabel {
    switch (category) {
      case RiskCategory.financial:
        return 'Financial';
      case RiskCategory.technical:
        return 'Technical';
      case RiskCategory.environmental:
        return 'Environmental';
    }
  }
}

/// Summary of risks within a single category
class CategoryRiskSummary {
  final RiskCategory category;
  final int totalRisks;
  final int lowCount;
  final int moderateCount;
  final int highCount;
  final int criticalCount;
  final double averageProbability;
  final double averageImpact;
  final double overallRiskScore; // Weighted average risk score

  const CategoryRiskSummary({
    required this.category,
    required this.totalRisks,
    required this.lowCount,
    required this.moderateCount,
    required this.highCount,
    required this.criticalCount,
    required this.averageProbability,
    required this.averageImpact,
    required this.overallRiskScore,
  });

  String get categoryLabel {
    switch (category) {
      case RiskCategory.financial:
        return 'Financial';
      case RiskCategory.technical:
        return 'Technical';
      case RiskCategory.environmental:
        return 'Environmental';
    }
  }
}

/// Overall risk prediction result
class RiskPredictionResult {
  final List<RiskItem> allRisks;
  final List<CategoryRiskSummary> categorySummaries;
  final double overallRiskScore;
  final RiskLevel overallLevel;

  const RiskPredictionResult({
    required this.allRisks,
    required this.categorySummaries,
    required this.overallRiskScore,
    required this.overallLevel,
  });
}

/// Heatmap cell data: probability (Y-axis) × impact (X-axis) → count of risks
class HeatmapCell {
  final int probIndex; // 0-4 (row)
  final int impactIndex; // 0-4 (column)
  final int count;
  final List<RiskItem> risks;

  const HeatmapCell({
    required this.probIndex,
    required this.impactIndex,
    required this.count,
    required this.risks,
  });
}

/// Generates realistic mock risk data for a DPR project
List<RiskItem> getMockRiskData() {
  return [
    // ── Financial Risks ──
    RiskItem(
      id: 'FIN-01',
      title: 'Budget Overrun',
      description: 'Project costs exceed the estimated budget due to scope creep, material price inflation, or unforeseen expenses.',
      category: RiskCategory.financial,
      level: RiskLevel.high,
      probability: 0.72,
      impact: 0.85,
      mitigation: 'Implement strict change control process. Maintain 15% contingency reserve. Monthly budget variance reviews.',
      trigger: 'Material costs increase by >10%, or more than 3 scope change requests approved.',
    ),
    RiskItem(
      id: 'FIN-02',
      title: 'Funding Delay',
      description: 'Government fund disbursement delayed beyond scheduled timeline, impacting project cash flow.',
      category: RiskCategory.financial,
      level: RiskLevel.moderate,
      probability: 0.45,
      impact: 0.70,
      mitigation: 'Establish bridge financing arrangement. Maintain 3-month operational reserve. Escalation path to finance ministry.',
      trigger: 'Fund release delayed by more than 30 days from scheduled date.',
    ),
    RiskItem(
      id: 'FIN-03',
      title: 'Currency Fluctuation Impact',
      description: 'Imported equipment costs affected by INR depreciation against USD/EUR.',
      category: RiskCategory.financial,
      level: RiskLevel.low,
      probability: 0.30,
      impact: 0.40,
      mitigation: 'Use forward contracts for major procurement. Source alternatives from domestic suppliers where possible.',
      trigger: 'INR depreciates by more than 5% against procurement currency.',
    ),
    RiskItem(
      id: 'FIN-04',
      title: 'ROI Below Target',
      description: 'Projected return on investment falls short of the minimum acceptable threshold of 12%.',
      category: RiskCategory.financial,
      level: RiskLevel.moderate,
      probability: 0.55,
      impact: 0.60,
      mitigation: 'Quarterly ROI recalculation with corrective actions. Identify additional revenue streams from smart city data monetization.',
      trigger: 'Interim ROI calculation shows returns below 8%.',
    ),

    // ── Technical Risks ──
    RiskItem(
      id: 'TECH-01',
      title: 'System Integration Failure',
      description: 'IoT devices, cloud platform, and legacy systems fail to integrate seamlessly, causing data silos.',
      category: RiskCategory.technical,
      level: RiskLevel.critical,
      probability: 0.60,
      impact: 0.90,
      mitigation: 'Conduct integration testing in staging environment. Use middleware/API gateway. Hire certified integration specialists.',
      trigger: 'More than 2 integration test cycles fail, or data sync latency exceeds 5 minutes.',
    ),
    RiskItem(
      id: 'TECH-02',
      title: 'Cybersecurity Breach',
      description: 'Unauthorized access to smart city systems exposing citizen data or critical infrastructure controls.',
      category: RiskCategory.technical,
      level: RiskLevel.critical,
      probability: 0.40,
      impact: 0.95,
      mitigation: 'Implement ISO 27001 framework. Quarterly penetration testing. 24/7 SOC monitoring. Zero-trust architecture.',
      trigger: 'Any unauthorized access attempt detected, or vulnerability scan reveals critical CVEs.',
    ),
    RiskItem(
      id: 'TECH-03',
      title: 'Technology Obsolescence',
      description: 'Chosen technology stack becomes outdated before project completion, requiring costly re-architecture.',
      category: RiskCategory.technical,
      level: RiskLevel.low,
      probability: 0.20,
      impact: 0.55,
      mitigation: 'Use modular, containerized architecture. Prefer open standards over proprietary solutions. Annual technology review.',
      trigger: 'Key vendor announces end-of-life for a core component within the project timeline.',
    ),
    RiskItem(
      id: 'TECH-04',
      title: 'Data Migration Loss',
      description: 'Data loss or corruption during migration from legacy municipal systems to the new platform.',
      category: RiskCategory.technical,
      level: RiskLevel.high,
      probability: 0.50,
      impact: 0.80,
      mitigation: 'Full backup before migration. Parallel run period of 3 months. Automated data validation checksums.',
      trigger: 'Data validation shows >0.1% record mismatch post-migration.',
    ),
    RiskItem(
      id: 'TECH-05',
      title: 'Scalability Bottleneck',
      description: 'System cannot handle projected IoT device load (50,000+ sensors) within acceptable response times.',
      category: RiskCategory.technical,
      level: RiskLevel.moderate,
      probability: 0.35,
      impact: 0.65,
      mitigation: 'Load testing at 2x projected capacity. Auto-scaling cloud infrastructure. CDN for static content.',
      trigger: 'Response time exceeds 2 seconds at 70% of projected load.',
    ),

    // ── Environmental Risks ──
    RiskItem(
      id: 'ENV-01',
      title: 'Construction Pollution Violation',
      description: 'Dust, noise, or water pollution from construction activities exceeds permissible CPCB limits.',
      category: RiskCategory.environmental,
      level: RiskLevel.high,
      probability: 0.55,
      impact: 0.75,
      mitigation: 'Install dust suppression systems. Real-time air quality monitoring. Schedule noisy work during permitted hours only.',
      trigger: 'AQI readings at site boundary exceed 200 for 3 consecutive days.',
    ),
    RiskItem(
      id: 'ENV-02',
      title: 'E-Waste Disposal Non-Compliance',
      description: 'Electronic waste from IoT device lifecycle not disposed per E-Waste Management Rules 2022.',
      category: RiskCategory.environmental,
      level: RiskLevel.moderate,
      probability: 0.40,
      impact: 0.60,
      mitigation: 'Partner with authorized e-waste recycler. Maintain disposal manifests. Include buyback clause in vendor contracts.',
      trigger: 'Accumulated e-waste exceeds 100 kg without documented disposal.',
    ),
    RiskItem(
      id: 'ENV-03',
      title: 'Green Cover Loss',
      description: 'Tree felling required for infrastructure deployment exceeds compensatory afforestation commitments.',
      category: RiskCategory.environmental,
      level: RiskLevel.low,
      probability: 0.25,
      impact: 0.50,
      mitigation: 'Route infrastructure to minimize tree impact. 3:1 compensatory plantation ratio. Use vertical gardens on structures.',
      trigger: 'More than 50 trees require felling, or compensatory plantation survival rate falls below 80%.',
    ),
    RiskItem(
      id: 'ENV-04',
      title: 'Carbon Footprint Exceeds Target',
      description: 'Project lifecycle carbon emissions exceed the sustainability target set in the environmental clearance.',
      category: RiskCategory.environmental,
      level: RiskLevel.moderate,
      probability: 0.45,
      impact: 0.55,
      mitigation: 'Use renewable energy for 40% of construction power. Procure low-carbon cement and steel. Purchase carbon credits if needed.',
      trigger: 'Quarterly carbon audit shows emissions >120% of pro-rated annual target.',
    ),
  ];
}
