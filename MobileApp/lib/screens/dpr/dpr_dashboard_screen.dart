import 'package:flutter/material.dart';
import 'dart:math';
import 'checklist_validator_screen.dart';

/// DPR Analytics Dashboard with Pass/Fail indicators, section scores,
/// current and previous charts, and government policy compliance.
class DprDashboardScreen extends StatefulWidget {
  @override
  _DprDashboardScreenState createState() => _DprDashboardScreenState();
}

class _DprDashboardScreenState extends State<DprDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedProject = 'Smart City Infrastructure';

  final List<String> _projects = [
    'Smart City Infrastructure',
    'E-Commerce Platform Redesign',
    'Hospital Management System',
    'Solar Power Plant Installation',
    'Mobile Banking Application',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('DPR Analytics Dashboard'),
        elevation: 2,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: [
            Tab(icon: Icon(Icons.dashboard), text: 'Overview'),
            Tab(icon: Icon(Icons.bar_chart), text: 'Charts'),
            Tab(icon: Icon(Icons.policy), text: 'Compliance'),
            Tab(icon: Icon(Icons.checklist), text: 'Checklist'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Project Selector
          Padding(
            padding: EdgeInsets.all(12),
            child: DropdownButtonFormField<String>(
              value: _selectedProject,
              decoration: InputDecoration(
                labelText: 'Select Project',
                prefixIcon: Icon(Icons.folder_open),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              items: _projects.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
              onChanged: (v) => setState(() { _selectedProject = v!; }),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildChartsTab(),
                _buildComplianceTab(),
                ChecklistValidatorWidget(projectName: _selectedProject),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════
  //  TAB 1: OVERVIEW — Pass/Fail + Section Scores
  // ═══════════════════════════════════════════════════════
  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Pass/Fail Indicator Card
          _buildPassFailCard(),
          SizedBox(height: 16),
          // Overall Score
          _buildOverallScoreCard(),
          SizedBox(height: 16),
          // Section-wise Breakdown
          _buildSectionTitle('Section-wise Breakdown'),
          SizedBox(height: 8),
          _buildSectionScoreCard('1. Executive Summary', 85, 'Pass'),
          _buildSectionScoreCard('2. Project Objectives', 78, 'Pass'),
          _buildSectionScoreCard('3. Technical Feasibility', 92, 'Pass'),
          _buildSectionScoreCard('4. Financial Analysis', 45, 'Fail'),
          _buildSectionScoreCard('5. Risk Assessment', 70, 'Pass'),
          _buildSectionScoreCard('6. Implementation Plan', 88, 'Pass'),
          _buildSectionScoreCard('7. Environmental Impact', 60, 'Borderline'),
          _buildSectionScoreCard('8. Social Impact Assessment', 82, 'Pass'),
          _buildSectionScoreCard('9. Legal & Regulatory', 95, 'Pass'),
          _buildSectionScoreCard('10. Monitoring & Evaluation', 73, 'Pass'),
        ],
      ),
    );
  }

  Widget _buildPassFailCard() {
    final overallScore = 76.8;
    final passed = overallScore >= 60;
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: passed ? Colors.green[50] : Colors.red[50],
      child: Padding(
        padding: EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: passed ? Colors.green : Colors.red,
                boxShadow: [BoxShadow(color: (passed ? Colors.green : Colors.red).withOpacity(0.4), blurRadius: 12, spreadRadius: 2)],
              ),
              child: Icon(passed ? Icons.check : Icons.close, color: Colors.white, size: 48),
            ),
            SizedBox(width: 20),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(passed ? 'DPR STATUS: PASSED' : 'DPR STATUS: FAILED',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: passed ? Colors.green[800] : Colors.red[800])),
                SizedBox(height: 4),
                Text('Overall Score: ${overallScore.toStringAsFixed(1)}%',
                  style: TextStyle(fontSize: 16, color: Colors.grey[700])),
                SizedBox(height: 4),
                Text('Minimum Required: 60% | Sections Passed: 8/10',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverallScoreCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Score Summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
              _buildMiniStat('Highest', '95%', Colors.green),
              _buildMiniStat('Average', '76.8%', Colors.blue),
              _buildMiniStat('Lowest', '45%', Colors.red),
              _buildMiniStat('Sections', '10', Colors.purple),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Column(children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(0.15)),
        child: Center(child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color))),
      ),
      SizedBox(height: 4),
      Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
    ]);
  }

  Widget _buildSectionScoreCard(String section, int score, String status) {
    Color statusColor;
    IconData statusIcon;
    if (status == 'Pass') { statusColor = Colors.green; statusIcon = Icons.check_circle; }
    else if (status == 'Fail') { statusColor = Colors.red; statusIcon = Icons.cancel; }
    else { statusColor = Colors.orange; statusIcon = Icons.warning; }

    return Card(
      margin: EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Icon(statusIcon, color: statusColor, size: 24),
            SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(section, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: score / 100.0,
                    backgroundColor: Colors.grey[200],
                    color: statusColor,
                    minHeight: 8,
                  ),
                ),
              ]),
            ),
            SizedBox(width: 12),
            Column(children: [
              Text('$score%', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: statusColor)),
              Text(status, style: TextStyle(fontSize: 10, color: statusColor)),
            ]),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════
  //  TAB 2: CHARTS — Current & Previous Performance
  // ═══════════════════════════════════════════════════════
  Widget _buildChartsTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Current Assessment Chart'),
          SizedBox(height: 8),
          _buildBarChart('Current', [85, 78, 92, 45, 70, 88, 60, 82, 95, 73]),
          SizedBox(height: 24),
          _buildSectionTitle('Previous Assessment Chart (Q3 2025)'),
          SizedBox(height: 8),
          _buildBarChart('Previous', [72, 65, 80, 38, 55, 75, 50, 70, 88, 60]),
          SizedBox(height: 24),
          _buildSectionTitle('Quarter-over-Quarter Comparison'),
          SizedBox(height: 8),
          _buildComparisonCard(),
          SizedBox(height: 24),
          _buildSectionTitle('Trend Analysis (Last 4 Quarters)'),
          SizedBox(height: 8),
          _buildTrendChart(),
          SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildBarChart(String label, List<int> scores) {
    final sections = ['ES', 'PO', 'TF', 'FA', 'RA', 'IP', 'EI', 'SI', 'LR', 'ME'];
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            SizedBox(
              height: 200,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: List.generate(scores.length, (i) {
                  final color = scores[i] >= 70 ? Colors.green : scores[i] >= 50 ? Colors.orange : Colors.red;
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 2),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text('${scores[i]}', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
                          SizedBox(height: 4),
                          Container(
                            height: scores[i] * 1.7,
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.8),
                              borderRadius: BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
            SizedBox(height: 8),
            // Section labels
            Row(
              children: sections.map((s) => Expanded(
                child: Text(s, textAlign: TextAlign.center, style: TextStyle(fontSize: 9, color: Colors.grey[600])),
              )).toList(),
            ),
            SizedBox(height: 8),
            // Pass line indicator
            Row(children: [
              Container(width: 16, height: 2, color: Colors.red),
              SizedBox(width: 4),
              Text('Pass threshold: 60%', style: TextStyle(fontSize: 10, color: Colors.grey[500])),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildComparisonCard() {
    final currentScores = [85, 78, 92, 45, 70, 88, 60, 82, 95, 73];
    final previousScores = [72, 65, 80, 38, 55, 75, 50, 70, 88, 60];
    final sectionNames = [
      'Executive Summary', 'Project Objectives', 'Technical Feasibility',
      'Financial Analysis', 'Risk Assessment', 'Implementation Plan',
      'Environmental Impact', 'Social Impact', 'Legal & Regulatory', 'Monitoring & Eval.',
    ];

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Column(children: [
          Row(children: [
            SizedBox(width: 24),
            Expanded(flex: 3, child: Text('Section', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
            Expanded(child: Text('Prev', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey))),
            Expanded(child: Text('Curr', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue))),
            Expanded(child: Text('Δ', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
          ]),
          Divider(),
          ...List.generate(10, (i) {
            final diff = currentScores[i] - previousScores[i];
            final diffColor = diff > 0 ? Colors.green : diff < 0 ? Colors.red : Colors.grey;
            return Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [
                Icon(diff > 0 ? Icons.arrow_upward : diff < 0 ? Icons.arrow_downward : Icons.remove,
                  size: 16, color: diffColor),
                SizedBox(width: 8),
                Expanded(flex: 3, child: Text(sectionNames[i], style: TextStyle(fontSize: 12))),
                Expanded(child: Text('${previousScores[i]}%', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey))),
                Expanded(child: Text('${currentScores[i]}%', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.blue))),
                Expanded(child: Text('${diff > 0 ? "+" : ""}$diff%', textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: diffColor))),
              ]),
            );
          }),
        ]),
      ),
    );
  }

  Widget _buildTrendChart() {
    final quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q1 2026'];
    final overallScores = [58.2, 64.5, 67.3, 76.8];
    final maxScore = 100.0;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(children: [
          SizedBox(
            height: 160,
            child: CustomPaint(
              size: Size(double.infinity, 160),
              painter: _TrendLinePainter(overallScores, maxScore),
            ),
          ),
          SizedBox(height: 8),
          Row(children: quarters.map((q) => Expanded(
            child: Text(q, textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
          )).toList()),
          SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(width: 12, height: 3, color: Colors.purple),
            SizedBox(width: 4),
            Text('Overall Score Trend', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
            SizedBox(width: 16),
            Container(width: 12, height: 1, color: Colors.red),
            SizedBox(width: 4),
            Text('Pass Threshold (60%)', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
          ]),
        ]),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════
  //  TAB 3: COMPLIANCE — Government Policy Checks
  // ═══════════════════════════════════════════════════════
  Widget _buildComplianceTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildComplianceSummaryCard(),
          SizedBox(height: 16),
          _buildSectionTitle('Government Policy Compliance Checks'),
          SizedBox(height: 8),
          _buildPolicyCard('National Infrastructure Pipeline (NIP) 2025', 'Compliant',
            'Project aligns with NIP objectives for smart city development and digital infrastructure.',
            Icons.check_circle, Colors.green),
          _buildPolicyCard('Environmental Protection Act, 1986', 'Compliant',
            'Environmental Impact Assessment completed. Clearance obtained from MoEF&CC.',
            Icons.check_circle, Colors.green),
          _buildPolicyCard('Right to Information Act, 2005', 'Compliant',
            'All project documents available for public disclosure as mandated.',
            Icons.check_circle, Colors.green),
          _buildPolicyCard('Public Procurement Policy for MSMEs', 'Partial',
            '15% procurement from MSMEs achieved. Target is 25% as per government policy.',
            Icons.warning, Colors.orange),
          _buildPolicyCard('Digital India Programme Guidelines', 'Compliant',
            'Project follows Digital India standards for data security and citizen services.',
            Icons.check_circle, Colors.green),
          _buildPolicyCard('State Finance Rules & GFR 2017', 'Non-Compliant',
            'Financial analysis incomplete. Budget utilization certificate pending for FY 2025-26.',
            Icons.cancel, Colors.red),
          _buildPolicyCard('Smart Cities Mission Guidelines', 'Compliant',
            'Aligned with SCM area-based development and pan-city solution frameworks.',
            Icons.check_circle, Colors.green),
          _buildPolicyCard('Labour Laws & Minimum Wages Act', 'Compliant',
            'All labor regulations followed. Wage compliance certificates submitted.',
            Icons.check_circle, Colors.green),
          _buildPolicyCard('Public-Private Partnership (PPP) Policy', 'Under Review',
            'PPP model documentation submitted. Awaiting PPPAC approval.',
            Icons.hourglass_top, Colors.blue),
          SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildComplianceSummaryCard() {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Policy Compliance Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 16),
            Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
              _buildComplianceStat('Compliant', '6', Colors.green, Icons.check_circle),
              _buildComplianceStat('Partial', '1', Colors.orange, Icons.warning),
              _buildComplianceStat('Non-Compliant', '1', Colors.red, Icons.cancel),
              _buildComplianceStat('Under Review', '1', Colors.blue, Icons.hourglass_top),
            ]),
            SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Row(children: [
                Expanded(flex: 6, child: Container(height: 12, color: Colors.green)),
                Expanded(flex: 1, child: Container(height: 12, color: Colors.orange)),
                Expanded(flex: 1, child: Container(height: 12, color: Colors.red)),
                Expanded(flex: 1, child: Container(height: 12, color: Colors.blue)),
              ]),
            ),
            SizedBox(height: 8),
            Text('Overall Compliance: 66.7% (6/9 policies fully met)', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }

  Widget _buildComplianceStat(String label, String value, Color color, IconData icon) {
    return Column(children: [
      Icon(icon, color: color, size: 28),
      SizedBox(height: 4),
      Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
      Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
    ]);
  }

  Widget _buildPolicyCard(String policy, String status, String details, IconData icon, Color color) {
    return Card(
      margin: EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ExpansionTile(
        leading: Icon(icon, color: color),
        title: Text(policy, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        subtitle: Container(
          margin: EdgeInsets.only(top: 4),
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
          child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
        ),
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Text(details, style: TextStyle(fontSize: 13, color: Colors.grey[700], height: 1.4)),
          ),
        ],
      ),
    );
  }

  // Helpers
  Widget _buildSectionTitle(String title) => Text(title,
    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.purple[800]));
}

/// Custom painter for drawing a trend line chart
class _TrendLinePainter extends CustomPainter {
  final List<double> scores;
  final double maxScore;
  _TrendLinePainter(this.scores, this.maxScore);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.purple..strokeWidth = 3..style = PaintingStyle.stroke..strokeCap = StrokeCap.round;
    final dotPaint = Paint()..color = Colors.purple..style = PaintingStyle.fill;
    final thresholdPaint = Paint()..color = Colors.red.withOpacity(0.5)..strokeWidth = 1..style = PaintingStyle.stroke;

    final padding = 20.0;
    final chartWidth = size.width - padding * 2;
    final chartHeight = size.height - padding * 2;

    // Draw threshold line at 60%
    final thresholdY = padding + chartHeight * (1 - 60.0 / maxScore);
    canvas.drawLine(Offset(padding, thresholdY), Offset(size.width - padding, thresholdY), thresholdPaint);

    // Draw the trend line
    final path = Path();
    for (int i = 0; i < scores.length; i++) {
      final x = padding + (chartWidth / (scores.length - 1)) * i;
      final y = padding + chartHeight * (1 - scores[i] / maxScore);
      if (i == 0) path.moveTo(x, y); else path.lineTo(x, y);
      canvas.drawCircle(Offset(x, y), 6, dotPaint);
      // Draw score label
      final textPainter = TextPainter(
        text: TextSpan(text: '${scores[i]}', style: TextStyle(fontSize: 10, color: Colors.purple, fontWeight: FontWeight.bold)),
        textDirection: TextDirection.ltr,
      )..layout();
      textPainter.paint(canvas, Offset(x - textPainter.width / 2, y - 18));
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
