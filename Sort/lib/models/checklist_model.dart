/// Severity levels for flagged checklist items
enum ChecklistSeverity { critical, warning, info }

/// A single validation criterion within a checklist category
class ChecklistItem {
  final String id;
  final String title;
  final String description;
  final bool isPassed;
  final ChecklistSeverity severity;
  final String recommendation;
  final String evidence;

  const ChecklistItem({
    required this.id,
    required this.title,
    required this.description,
    required this.isPassed,
    this.severity = ChecklistSeverity.info,
    this.recommendation = '',
    this.evidence = '',
  });

  ChecklistItem copyWith({
    String? id,
    String? title,
    String? description,
    bool? isPassed,
    ChecklistSeverity? severity,
    String? recommendation,
    String? evidence,
  }) {
    return ChecklistItem(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      isPassed: isPassed ?? this.isPassed,
      severity: severity ?? this.severity,
      recommendation: recommendation ?? this.recommendation,
      evidence: evidence ?? this.evidence,
    );
  }
}

/// A group of related checklist items under a DPR section
class ChecklistCategory {
  final String name;
  final String icon; // Material icon name for display reference
  final List<ChecklistItem> items;

  const ChecklistCategory({
    required this.name,
    required this.items,
    this.icon = 'checklist',
  });

  int get totalItems => items.length;
  int get passedItems => items.where((i) => i.isPassed).length;
  int get failedItems => items.where((i) => !i.isPassed).length;
  double get passRate => totalItems > 0 ? passedItems / totalItems : 0.0;

  int get criticalCount =>
      items.where((i) => !i.isPassed && i.severity == ChecklistSeverity.critical).length;
  int get warningCount =>
      items.where((i) => !i.isPassed && i.severity == ChecklistSeverity.warning).length;
  int get infoCount =>
      items.where((i) => !i.isPassed && i.severity == ChecklistSeverity.info).length;
}

/// Summary statistics for a full checklist validation
class ChecklistSummary {
  final int totalItems;
  final int passedItems;
  final int failedItems;
  final int criticalCount;
  final int warningCount;
  final int infoCount;

  const ChecklistSummary({
    required this.totalItems,
    required this.passedItems,
    required this.failedItems,
    required this.criticalCount,
    required this.warningCount,
    required this.infoCount,
  });

  double get passRate => totalItems > 0 ? passedItems / totalItems : 0.0;
  bool get hasIssues => failedItems > 0;
  bool get hasCritical => criticalCount > 0;
}

/// Generates realistic mock checklist data for demonstration
List<ChecklistCategory> getMockChecklistData() {
  return [
    // ── 1. Executive Summary ──
    ChecklistCategory(
      name: 'Executive Summary',
      icon: 'description',
      items: [
        ChecklistItem(
          id: 'ES-01',
          title: 'Project overview is clearly stated',
          description: 'The executive summary must contain a concise, clear overview of the project purpose and goals.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'ES-02',
          title: 'Key stakeholders are identified',
          description: 'All primary stakeholders and beneficiaries must be listed with roles.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'ES-03',
          title: 'Expected outcomes are quantified',
          description: 'Outcomes should include measurable KPIs and target values.',
          isPassed: false,
          severity: ChecklistSeverity.warning,
          recommendation: 'Add specific KPI targets (e.g., "reduce traffic congestion by 30%") instead of vague goals.',
          evidence: 'Section 1.3 uses qualitative language only — "improve traffic flow" without measurable targets.',
        ),
      ],
    ),

    // ── 2. Technical Feasibility ──
    ChecklistCategory(
      name: 'Technical Feasibility',
      icon: 'engineering',
      items: [
        ChecklistItem(
          id: 'TF-01',
          title: 'Technology stack is documented',
          description: 'All technologies, platforms, and frameworks must be listed with version numbers.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'TF-02',
          title: 'Scalability plan included',
          description: 'The system architecture must support projected growth over 5 years.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'TF-03',
          title: 'Third-party dependency risks assessed',
          description: 'All external libraries and vendor dependencies must have risk mitigation plans.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'TF-04',
          title: 'Data migration strategy defined',
          description: 'Plan for migrating legacy data to the new system must be documented.',
          isPassed: false,
          severity: ChecklistSeverity.critical,
          recommendation: 'Document the complete data migration plan including source mapping, transformation rules, rollback procedures, and estimated downtime.',
          evidence: 'No data migration section found in the technical feasibility chapter. Legacy system contains 2.3M records that require migration.',
        ),
      ],
    ),

    // ── 3. Financial Analysis ──
    ChecklistCategory(
      name: 'Financial Analysis',
      icon: 'account_balance',
      items: [
        ChecklistItem(
          id: 'FA-01',
          title: 'Detailed cost breakdown provided',
          description: 'Budget must be broken down into capital expenditure, operational costs, and contingency.',
          isPassed: false,
          severity: ChecklistSeverity.critical,
          recommendation: 'Provide an itemized cost breakdown with CAPEX, OPEX, and at least 10% contingency allocation. Current budget is listed as a single lump sum.',
          evidence: 'Section 4.1 shows only total budget (₹25 Cr) without any sub-category breakdown. GFR 2017 Rule 56 requires detailed estimates.',
        ),
        ChecklistItem(
          id: 'FA-02',
          title: 'ROI projection included',
          description: 'Return on investment must be calculated with a minimum 5-year projection.',
          isPassed: false,
          severity: ChecklistSeverity.critical,
          recommendation: 'Add a 5-year ROI model with NPV, IRR, and payback period calculations. Include sensitivity analysis for key variables.',
          evidence: 'No ROI section found. Government DPR guidelines mandate ROI/cost-benefit analysis for projects exceeding ₹10 Cr.',
        ),
        ChecklistItem(
          id: 'FA-03',
          title: 'Funding sources identified',
          description: 'All funding sources (government grants, private investment, loans) must be clearly documented.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'FA-04',
          title: 'Budget utilization certificate attached',
          description: 'For ongoing projects, previous year budget utilization certificate is mandatory.',
          isPassed: false,
          severity: ChecklistSeverity.warning,
          recommendation: 'Obtain and attach the FY 2025-26 budget utilization certificate from the Finance department.',
          evidence: 'Utilization certificate for FY 2025-26 is missing. Last available certificate is for FY 2024-25.',
        ),
      ],
    ),

    // ── 4. Risk Assessment ──
    ChecklistCategory(
      name: 'Risk Assessment',
      icon: 'warning_amber',
      items: [
        ChecklistItem(
          id: 'RA-01',
          title: 'Risk register is comprehensive',
          description: 'At least 10 major risk categories must be identified with probability and impact ratings.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'RA-02',
          title: 'Mitigation strategies are defined',
          description: 'Each identified risk must have a corresponding mitigation plan with responsible owners.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'RA-03',
          title: 'Contingency budget allocated',
          description: 'A separate contingency fund (typically 5-15% of project cost) must be earmarked for risk events.',
          isPassed: false,
          severity: ChecklistSeverity.warning,
          recommendation: 'Allocate a specific contingency fund (minimum 10% of total budget) and document the drawdown criteria.',
          evidence: 'Risk section mentions contingency but no specific amount is budgeted. References "as needed" allocation which is insufficient for government projects.',
        ),
      ],
    ),

    // ── 5. Implementation Plan ──
    ChecklistCategory(
      name: 'Implementation Plan',
      icon: 'timeline',
      items: [
        ChecklistItem(
          id: 'IP-01',
          title: 'Project timeline with milestones',
          description: 'A Gantt chart or equivalent timeline with major milestones and deliverables.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'IP-02',
          title: 'Resource allocation plan',
          description: 'Human resources, equipment, and material requirements must be documented per phase.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'IP-03',
          title: 'Quality assurance process defined',
          description: 'QA/QC procedures, testing protocols, and acceptance criteria must be documented.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'IP-04',
          title: 'Handover & training plan included',
          description: 'Post-implementation handover procedures and end-user training plan must be documented.',
          isPassed: false,
          severity: ChecklistSeverity.info,
          recommendation: 'Add a section covering knowledge transfer sessions, user training schedule, and documentation handover checklist.',
          evidence: 'Implementation plan covers development phases but does not address post-deployment training or handover process.',
        ),
      ],
    ),

    // ── 6. Environmental Impact ──
    ChecklistCategory(
      name: 'Environmental Impact',
      icon: 'eco',
      items: [
        ChecklistItem(
          id: 'EI-01',
          title: 'Environmental clearance obtained',
          description: 'MoEF&CC clearance required for projects with potential environmental impact.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'EI-02',
          title: 'Carbon footprint assessment done',
          description: 'Project must include an assessment of carbon emissions during construction and operation.',
          isPassed: false,
          severity: ChecklistSeverity.info,
          recommendation: 'Commission a carbon footprint study covering Scope 1 and Scope 2 emissions for the project lifecycle.',
          evidence: 'Environmental section mentions sustainability goals but lacks a quantified carbon footprint analysis.',
        ),
        ChecklistItem(
          id: 'EI-03',
          title: 'Waste management plan documented',
          description: 'Construction and operational waste management procedures must be outlined.',
          isPassed: true,
        ),
      ],
    ),

    // ── 7. Legal & Regulatory ──
    ChecklistCategory(
      name: 'Legal & Regulatory',
      icon: 'gavel',
      items: [
        ChecklistItem(
          id: 'LR-01',
          title: 'All required permits obtained',
          description: 'Verify that land permits, building permits, and operational licenses are in place.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'LR-02',
          title: 'Data privacy compliance (IT Act 2000)',
          description: 'If the project involves personal data, compliance with IT Act 2000 and upcoming DPDP Act must be ensured.',
          isPassed: true,
        ),
        ChecklistItem(
          id: 'LR-03',
          title: 'Labour law compliance documented',
          description: 'Proof of compliance with Minimum Wages Act, Contract Labour Act, and EPFO regulations.',
          isPassed: true,
        ),
      ],
    ),
  ];
}
