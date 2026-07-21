import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class RiskAlertsScreen extends StatefulWidget {
  const RiskAlertsScreen({super.key});

  @override
  State<RiskAlertsScreen> createState() => _RiskAlertsScreenState();
}

class _RiskAlertsScreenState extends State<RiskAlertsScreen> {
  String _selectedLevel = 'All';

  final List<Map<String, dynamic>> _alerts = [
    {
      'id': 'DPR-001',
      'title': 'Smart City Infrastructure Development',
      'level': 'High',
      'factors': ['Budget Overrun', 'System Integration Failure'],
      'state': 'NE Region',
    },
    {
      'id': 'DPR-003',
      'title': 'Hospital Management System',
      'level': 'Critical',
      'factors': ['Data Migration Loss', 'Cybersecurity Breach'],
      'state': 'NE Region',
    },
    {
      'id': 'DPR-004',
      'title': 'Solar Power Plant Installation',
      'level': 'High',
      'factors': ['Construction Pollution', 'Funding Delay'],
      'state': 'NE Region',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Risk Alerts'),
      ),
      body: Column(
        children: [
          _buildAlertSummary(),
          _buildFilterRow(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _alerts.length,
              itemBuilder: (context, index) {
                final alert = _alerts[index];
                return _buildAlertCard(alert);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertSummary() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.accentRed.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.accentRed.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildAlertStat('Total Alerts', '${_alerts.length}', AppTheme.textPrimary),
          _buildAlertStat('Critical', '1', AppTheme.accentRed),
          _buildAlertStat('High Risk', '2', AppTheme.accentAmber),
        ],
      ),
    );
  }

  Widget _buildAlertStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      ],
    );
  }

  Widget _buildFilterRow() {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: ['All', 'Critical', 'High', 'Medium'].map((level) {
          final isSelected = _selectedLevel == level;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(level, style: const TextStyle(fontSize: 12)),
              selected: isSelected,
              onSelected: (val) => setState(() => _selectedLevel = level),
              selectedColor: AppTheme.accentRed.withOpacity(0.2),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildAlertCard(Map<String, dynamic> alert) {
    final levelColor = alert['level'] == 'Critical' ? AppTheme.accentRed : AppTheme.accentAmber;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(alert['id'], style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: AppTheme.accentBlue)),
                _buildSmallBadge(alert['level'], levelColor),
              ],
            ),
            const SizedBox(height: 12),
            Text(alert['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            const Text('Primary Risk Factors:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
            const SizedBox(height: 4),
            ...(alert['factors'] as List<String>).map((f) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                children: [
                  const Icon(Icons.circle, size: 6, color: AppTheme.accentRed),
                  const SizedBox(width: 8),
                  Text(f, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
            )).toList(),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(alert['state'], style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                TextButton(
                  onPressed: () {},
                  child: const Text('Review Analysis'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}
