/// Model representing a Detailed Project Report (DPR)
class DprModel {
  final String id;
  final String projectTitle;
  final String projectDescription;
  final String clientName;
  final String projectManager;
  final String department;
  final String category;
  final DateTime startDate;
  final DateTime endDate;
  final double estimatedBudget;
  final String status; // Draft, Submitted, Under Review, Approved, Rejected
  final String priority; // Low, Medium, High, Critical
  final List<String> attachments; // File names
  final List<String> teamMembers;
  final String objectives;
  final String scope;
  final String methodology;
  final String remarks;
  final DateTime createdAt;
  final DateTime updatedAt;
  final double progress; // 0.0 to 1.0

  DprModel({
    required this.id,
    required this.projectTitle,
    required this.projectDescription,
    required this.clientName,
    required this.projectManager,
    required this.department,
    required this.category,
    required this.startDate,
    required this.endDate,
    required this.estimatedBudget,
    required this.status,
    required this.priority,
    required this.attachments,
    required this.teamMembers,
    required this.objectives,
    required this.scope,
    required this.methodology,
    required this.remarks,
    required this.createdAt,
    required this.updatedAt,
    required this.progress,
  });

  DprModel copyWith({
    String? id,
    String? projectTitle,
    String? projectDescription,
    String? clientName,
    String? projectManager,
    String? department,
    String? category,
    DateTime? startDate,
    DateTime? endDate,
    double? estimatedBudget,
    String? status,
    String? priority,
    List<String>? attachments,
    List<String>? teamMembers,
    String? objectives,
    String? scope,
    String? methodology,
    String? remarks,
    DateTime? createdAt,
    DateTime? updatedAt,
    double? progress,
  }) {
    return DprModel(
      id: id ?? this.id,
      projectTitle: projectTitle ?? this.projectTitle,
      projectDescription: projectDescription ?? this.projectDescription,
      clientName: clientName ?? this.clientName,
      projectManager: projectManager ?? this.projectManager,
      department: department ?? this.department,
      category: category ?? this.category,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      estimatedBudget: estimatedBudget ?? this.estimatedBudget,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      attachments: attachments ?? this.attachments,
      teamMembers: teamMembers ?? this.teamMembers,
      objectives: objectives ?? this.objectives,
      scope: scope ?? this.scope,
      methodology: methodology ?? this.methodology,
      remarks: remarks ?? this.remarks,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      progress: progress ?? this.progress,
    );
  }
}

/// Sample mock data for demonstration
List<DprModel> getMockDprList() {
  return [
    DprModel(
      id: 'DPR-001',
      projectTitle: 'Smart City Infrastructure Development',
      projectDescription: 'Development of IoT-based smart city infrastructure including traffic management, waste management, and public safety systems.',
      clientName: 'Municipal Corporation',
      projectManager: 'Rajesh Kumar',
      department: 'Infrastructure',
      category: 'Government',
      startDate: DateTime(2026, 1, 15),
      endDate: DateTime(2026, 12, 31),
      estimatedBudget: 25000000.0,
      status: 'Approved',
      priority: 'High',
      attachments: ['proposal.pdf', 'budget_sheet.xlsx', 'site_survey.pdf'],
      teamMembers: ['Amit Sharma', 'Priya Singh', 'Vikram Patel'],
      objectives: 'To implement a comprehensive smart city solution that improves urban living standards through technology integration.',
      scope: 'Phase 1 covers traffic management and public safety. Phase 2 covers waste management and energy optimization.',
      methodology: 'Agile methodology with 2-week sprints. Regular stakeholder reviews every month.',
      remarks: 'Priority project approved by the board.',
      createdAt: DateTime(2026, 1, 5),
      updatedAt: DateTime(2026, 3, 20),
      progress: 0.45,
    ),
    DprModel(
      id: 'DPR-002',
      projectTitle: 'E-Commerce Platform Redesign',
      projectDescription: 'Complete overhaul of the existing e-commerce platform with modern UI/UX, improved performance, and mobile-first approach.',
      clientName: 'RetailMax Pvt. Ltd.',
      projectManager: 'Sneha Gupta',
      department: 'Software Development',
      category: 'Private',
      startDate: DateTime(2026, 3, 1),
      endDate: DateTime(2026, 8, 31),
      estimatedBudget: 8500000.0,
      status: 'Under Review',
      priority: 'Medium',
      attachments: ['wireframes.fig', 'requirements.docx'],
      teamMembers: ['Rohit Mehta', 'Ananya Das'],
      objectives: 'Increase online sales by 40% and improve customer retention through a modernized shopping experience.',
      scope: 'Frontend redesign, API optimization, payment gateway integration, and analytics dashboard.',
      methodology: 'Design thinking approach followed by iterative development cycles.',
      remarks: 'Awaiting budget approval from finance department.',
      createdAt: DateTime(2026, 2, 15),
      updatedAt: DateTime(2026, 4, 10),
      progress: 0.15,
    ),
    DprModel(
      id: 'DPR-003',
      projectTitle: 'Hospital Management System',
      projectDescription: 'Digital transformation of hospital operations including patient records, appointment scheduling, billing, and pharmacy management.',
      clientName: 'City General Hospital',
      projectManager: 'Dr. Meena Iyer',
      department: 'Healthcare IT',
      category: 'Healthcare',
      startDate: DateTime(2026, 4, 1),
      endDate: DateTime(2027, 3, 31),
      estimatedBudget: 15000000.0,
      status: 'Draft',
      priority: 'Critical',
      attachments: ['initial_proposal.pdf'],
      teamMembers: ['Karan Joshi', 'Divya Nair', 'Suresh Reddy', 'Fatima Khan'],
      objectives: 'Digitize all hospital operations to improve efficiency, reduce wait times, and enhance patient care quality.',
      scope: 'OPD management, IPD management, pharmacy, lab, billing, and reporting modules.',
      methodology: 'Waterfall model with defined milestones for each module delivery.',
      remarks: 'Initial draft pending review by medical board.',
      createdAt: DateTime(2026, 3, 25),
      updatedAt: DateTime(2026, 4, 1),
      progress: 0.05,
    ),
    DprModel(
      id: 'DPR-004',
      projectTitle: 'Solar Power Plant Installation',
      projectDescription: 'Installation of a 50MW solar power plant with grid connectivity and monitoring systems.',
      clientName: 'GreenEnergy Corp.',
      projectManager: 'Arun Nair',
      department: 'Energy',
      category: 'Renewable Energy',
      startDate: DateTime(2025, 6, 1),
      endDate: DateTime(2026, 5, 31),
      estimatedBudget: 50000000.0,
      status: 'Submitted',
      priority: 'High',
      attachments: ['feasibility_study.pdf', 'environmental_clearance.pdf', 'land_survey.pdf', 'cost_analysis.xlsx'],
      teamMembers: ['Manoj Tiwari', 'Lakshmi Rao'],
      objectives: 'Generate 50MW of clean solar energy to contribute to the national renewable energy targets.',
      scope: 'Site preparation, panel installation, grid connectivity, SCADA system setup, and commissioning.',
      methodology: 'EPC (Engineering, Procurement, Construction) model with phased delivery.',
      remarks: 'Environmental clearance obtained. Awaiting final financial approval.',
      createdAt: DateTime(2025, 5, 10),
      updatedAt: DateTime(2026, 4, 15),
      progress: 0.70,
    ),
    DprModel(
      id: 'DPR-005',
      projectTitle: 'Mobile Banking Application',
      projectDescription: 'Development of a secure mobile banking application for Android and iOS with biometric authentication and UPI integration.',
      clientName: 'National Cooperative Bank',
      projectManager: 'Pooja Deshmukh',
      department: 'FinTech',
      category: 'Banking',
      startDate: DateTime(2026, 2, 1),
      endDate: DateTime(2026, 10, 31),
      estimatedBudget: 12000000.0,
      status: 'Rejected',
      priority: 'Low',
      attachments: ['app_mockups.pdf', 'security_audit.pdf'],
      teamMembers: ['Nikhil Verma', 'Swati Kulkarni', 'Ajay Pandey'],
      objectives: 'Provide seamless digital banking services to 500,000+ rural and semi-urban customers.',
      scope: 'Account management, fund transfers, UPI payments, bill payments, and loan applications.',
      methodology: 'Agile with CI/CD pipeline for continuous delivery.',
      remarks: 'Rejected due to budget constraints. Resubmission expected next quarter.',
      createdAt: DateTime(2026, 1, 20),
      updatedAt: DateTime(2026, 3, 5),
      progress: 0.0,
    ),
  ];
}
