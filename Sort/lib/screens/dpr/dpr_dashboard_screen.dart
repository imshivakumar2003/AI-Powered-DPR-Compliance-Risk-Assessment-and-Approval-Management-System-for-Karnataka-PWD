import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../theme/app_theme.dart';
import '../../providers/dpr_provider.dart';
import 'checklist_validator_screen.dart';

class DprDashboardScreen extends StatefulWidget {
  const DprDashboardScreen({super.key});

  @override
  State<DprDashboardScreen> createState() => _DprDashboardScreenState();
}

class _DprDashboardScreenState extends State<DprDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

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
    final dprProvider = Provider.of<DprProvider>(context);
    final projects = dprProvider.allDprs.map((d) => d.projectTitle).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Command Center'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.accentBlue,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.accentBlue,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Analysis'),
            Tab(text: 'Compliance'),
            Tab(text: 'Checklist'),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: DropdownButtonFormField<String>(
              value: projects.first,
              decoration: const InputDecoration(
                labelText: 'Active Project',
                prefixIcon: Icon(Icons.folder_open, size: 20),
              ),
              items: projects.map((p) => DropdownMenuItem(value: p, child: Text(p, style: const TextStyle(fontSize: 14)))).toList(),
              onChanged: (v) {},
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildAnalysisTab(),
                _buildComplianceTab(),
                const ChecklistValidatorWidget(projectName: 'Smart City'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildPassFailCard(true, 78.5),
          const SizedBox(height: 20),
          _buildStatsGrid(),
          const SizedBox(height: 24),
          _buildSectionHeader('Component Scores'),
          const SizedBox(height: 12),
          _buildScoreTile('Executive Summary', 85, AppTheme.accentGreen),
          _buildScoreTile('Technical Feasibility', 92, AppTheme.accentGreen),
          _buildScoreTile('Financial Analysis', 45, AppTheme.accentRed),
          _buildScoreTile('Risk Assessment', 70, AppTheme.accentAmber),
        ],
      ),
    );
  }

  Widget _buildPassFailCard(bool passed, double score) {
    final color = passed ? AppTheme.accentGreen : AppTheme.accentRed;
    return Card(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: [color.withOpacity(0.05), color.withOpacity(0.15)],
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withOpacity(0.2),
                border: Border.all(color: color, width: 2),
              ),
              child: Icon(passed ? Icons.check : Icons.close, color: color, size: 32),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(passed ? 'DPR STATUS: PASSED' : 'DPR STATUS: FAILED',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
                  const SizedBox(height: 4),
                  Text('Score: $score% | Threshold: 60.0%', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      childAspectRatio: 1.2,
      crossAxisSpacing: 12,
      children: [
        _buildMiniStat('Highest', '95%', AppTheme.accentGreen),
        _buildMiniStat('Average', '76%', AppTheme.accentBlue),
        _buildMiniStat('Lowest', '45%', AppTheme.accentRed),
      ],
    );
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Card(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  Widget _buildScoreTile(String title, int score, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
              Text('$score%', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: score / 100,
              minHeight: 6,
              backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisTab() {
    return const Center(child: Text('Detailed Analytics View', style: TextStyle(color: AppTheme.textSecondary)));
  }

  Widget _buildComplianceTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildPolicyItem('NIP 2025 Compliance', 'Compliant', AppTheme.accentGreen),
        _buildPolicyItem('Environmental Act 1986', 'Compliant', AppTheme.accentGreen),
        _buildPolicyItem('State Finance Rules', 'Non-Compliant', AppTheme.accentRed),
        _buildPolicyItem('PPP Policy Review', 'Under Review', AppTheme.accentBlue),
      ],
    );
  }

  Widget _buildPolicyItem(String title, String status, Color color) {
    return Card(
      child: ListTile(
        leading: Icon(Icons.policy_outlined, color: color),
        title: Text(title, style: const TextStyle(fontSize: 14)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
          child: Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        const Spacer(),
        TextButton(onPressed: () {}, child: const Text('View All', style: TextStyle(fontSize: 12))),
      ],
    );
  }
}
