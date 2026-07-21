import 'package:flutter/material.dart';
import '../../models/dpr_model.dart';
import '../../models/checklist_model.dart';
import '../../models/risk_prediction_model.dart';
import '../../theme/app_theme.dart';

class DprDetailScreen extends StatefulWidget {
  final DprModel dpr;
  const DprDetailScreen({Key? key, required this.dpr}) : super(key: key);

  @override
  State<DprDetailScreen> createState() => _DprDetailScreenState();
}

class _DprDetailScreenState extends State<DprDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _selectedDecision;
  final TextEditingController _justificationController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _justificationController.dispose();
    super.dispose();
  }

  Color _getStatusColor(String s) {
    switch (s) {
      case 'Draft': return AppTheme.textMuted;
      case 'Submitted': return AppTheme.accentBlue;
      case 'Under Review': return AppTheme.accentAmber;
      case 'Approved': return AppTheme.accentGreen;
      case 'Rejected': return AppTheme.accentRed;
      default: return AppTheme.textMuted;
    }
  }

  String _formatBudget(double a) {
    if (a >= 10000000) return '₹${(a / 10000000).toStringAsFixed(2)} Cr';
    if (a >= 100000) return '₹${(a / 100000).toStringAsFixed(2)} L';
    return '₹${a.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('DPR · ${widget.dpr.id}', style: const TextStyle(fontSize: 16)),
            Text(widget.dpr.projectTitle, 
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.normal),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.download_outlined), onPressed: () {}),
          IconButton(icon: const Icon(Icons.share_outlined), onPressed: () {}),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.accentBlue,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.accentBlue,
          tabs: const [
            Tab(text: 'Assessment'),
            Tab(text: 'Risk'),
            Tab(text: 'Recommendations'),
            Tab(text: 'Timeline'),
            Tab(text: 'Documents'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAssessmentTab(),
          _buildRiskTab(),
          _buildRecommendationsTab(),
          _buildTimelineTab(),
          _buildDocumentsTab(),
        ],
      ),
    );
  }

  Widget _buildAssessmentTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeaderInfo(),
          const SizedBox(height: 20),
          _buildScoreRings(),
          const SizedBox(height: 20),
          _buildQualityDimensions(),
          const SizedBox(height: 20),
          _buildDecisionPanel(),
        ],
      ),
    );
  }

  Widget _buildHeaderInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildBadge(widget.dpr.status, _getStatusColor(widget.dpr.status)),
                const SizedBox(width: 8),
                _buildBadge('${widget.dpr.priority} Priority', AppTheme.accentAmber),
                const SizedBox(width: 8),
                _buildBadge(widget.dpr.category, AppTheme.accentBlue),
              ],
            ),
            const SizedBox(height: 12),
            Text(widget.dpr.projectTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(widget.dpr.projectDescription, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Text(widget.dpr.department, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                const SizedBox(width: 16),
                const Icon(Icons.currency_rupee, size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Text(_formatBudget(widget.dpr.estimatedBudget), style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildScoreRings() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildScoreRing('Quality Score', 85, AppTheme.accentGreen),
        _buildScoreRing('Risk Score', 42, AppTheme.accentAmber),
      ],
    );
  }

  Widget _buildScoreRing(String label, int score, Color color) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              height: 80,
              width: 80,
              child: CircularProgressIndicator(
                value: score / 100,
                strokeWidth: 8,
                backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
            Column(
              children: [
                Text('$score', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
                const Text('/100', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
      ],
    );
  }

  Widget _buildQualityDimensions() {
    final dimensions = [
      {'label': 'Technical Feasibility', 'score': 92, 'color': AppTheme.accentGreen},
      {'label': 'Financial Viability', 'score': 78, 'color': AppTheme.accentAmber},
      {'label': 'Environmental Impact', 'score': 88, 'color': AppTheme.accentGreen},
      {'label': 'Social Benefit', 'score': 95, 'color': AppTheme.accentGreen},
      {'label': 'Risk Mitigation', 'score': 65, 'color': AppTheme.accentAmber},
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Quality Dimensions', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...dimensions.map((d) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(d['label'] as String, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      Text('${d['score']}%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: d['color'] as Color)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  LinearProgressIndicator(
                    value: (d['score'] as int) / 100,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation<Color>(d['color'] as Color),
                    minHeight: 6,
                  ),
                ],
              ),
            )).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildDecisionPanel() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Reviewer Decision', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => setState(() => _selectedDecision = 'Approve'),
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Approve'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _selectedDecision == 'Approve' ? Colors.white : AppTheme.accentGreen,
                      backgroundColor: _selectedDecision == 'Approve' ? AppTheme.accentGreen : Colors.transparent,
                      side: BorderSide(color: AppTheme.accentGreen),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => setState(() => _selectedDecision = 'Reject'),
                    icon: const Icon(Icons.cancel_outlined),
                    label: const Text('Reject'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _selectedDecision == 'Reject' ? Colors.white : AppTheme.accentRed,
                      backgroundColor: _selectedDecision == 'Reject' ? AppTheme.accentRed : Colors.transparent,
                      side: BorderSide(color: AppTheme.accentRed),
                    ),
                  ),
                ),
              ],
            ),
            if (_selectedDecision != null) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _justificationController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Provide justification for your decision...',
                  fillColor: AppTheme.bgPrimary.withOpacity(0.5),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {},
                child: const Text('Submit Decision'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRiskTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Top Risk Factors', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _buildRiskItem('Technical Complexity', 'High probability of integration delays due to legacy system incompatibility.', AppTheme.accentRed),
          _buildRiskItem('Budget Overrun', 'Significant risk of cost escalation in procurement phase.', AppTheme.accentAmber),
          _buildRiskItem('Environmental Clearance', 'Potential delays in obtaining mandatory state permits.', AppTheme.accentAmber),
          const SizedBox(height: 24),
          const Text('Mitigation Actions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _buildMitigationItem('Early Vendor Engagement', 'Engage technical consultants 2 months prior to procurement.'),
          _buildMitigationItem('Contingency Buffer', 'Increase financial contingency to 15% for unforeseen state-level levies.'),
        ],
      ),
    );
  }

  Widget _buildRiskItem(String title, String desc, Color color) {
    return Card(
      child: ListTile(
        leading: Icon(Icons.warning_amber_rounded, color: color),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(desc, style: const TextStyle(fontSize: 12)),
      ),
    );
  }

  Widget _buildMitigationItem(String title, String desc) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.check_circle_outline, color: AppTheme.accentBlue),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(desc, style: const TextStyle(fontSize: 12)),
      ),
    );
  }

  Widget _buildRecommendationsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildBadge(index == 0 ? 'CRITICAL' : 'HIGH', index == 0 ? AppTheme.accentRed : AppTheme.accentAmber),
                    const Icon(Icons.lightbulb_outline, size: 20, color: AppTheme.accentPurple),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Optimize Procurement Timeline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                const Text('Current procurement cycle of 9 months is 20% higher than average for this sector. Recommended to use GeM portal for faster processing.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
                const SizedBox(height: 16),
                const Text('Actionable Steps:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                const SizedBox(height: 8),
                _buildStep(1, 'Identify items available on GeM'),
                _buildStep(2, 'Reduce tender evaluation period from 30 to 15 days'),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStep(int num, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$num. ', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentPurple)),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
        ],
      ),
    );
  }

  Widget _buildTimelineTab() {
    final events = [
      {'title': 'DPR Submitted', 'date': 'Jan 15, 2026', 'status': 'done'},
      {'title': 'Technical Review', 'date': 'Jan 28, 2026', 'status': 'done'},
      {'title': 'Financial Review', 'date': 'Feb 10, 2026', 'status': 'done'},
      {'title': 'Final Approval', 'date': 'Expected Mar 20, 2026', 'status': 'pending'},
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final e = events[index];
        final isLast = index == events.length - 1;
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: e['status'] == 'done' ? AppTheme.accentGreen : Colors.transparent,
                    shape: BoxShape.circle,
                    border: Border.all(color: e['status'] == 'done' ? AppTheme.accentGreen : AppTheme.border, width: 2),
                  ),
                  child: e['status'] == 'done' ? const Icon(Icons.check, size: 12, color: Colors.white) : null,
                ),
                if (!isLast) Container(width: 2, height: 40, color: AppTheme.border),
              ],
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(e['title']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(e['date']!, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildDocumentsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: widget.dpr.attachments.length,
      itemBuilder: (context, index) {
        final f = widget.dpr.attachments[index];
        return Card(
          child: ListTile(
            leading: Icon(
              f.endsWith('.pdf') ? Icons.picture_as_pdf : f.endsWith('.xlsx') ? Icons.table_chart : Icons.insert_drive_file,
              color: f.endsWith('.pdf') ? AppTheme.accentRed : f.endsWith('.xlsx') ? AppTheme.accentGreen : AppTheme.accentBlue,
            ),
            title: Text(f, style: const TextStyle(fontSize: 14)),
            subtitle: const Text('Parsed and Validated', style: TextStyle(fontSize: 10, color: AppTheme.accentGreen)),
            trailing: const Icon(Icons.download_rounded, size: 20, color: AppTheme.textMuted),
            onTap: () {},
          ),
        );
      },
    );
  }
}
