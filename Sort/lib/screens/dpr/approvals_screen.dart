import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class ApprovalsScreen extends StatefulWidget {
  const ApprovalsScreen({super.key});

  @override
  State<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends State<ApprovalsScreen> {
  final List<Map<String, dynamic>> _pendingDprs = [
    {
      'id': 'DPR-002',
      'title': 'E-Commerce Platform Redesign',
      'state': 'NE Region',
      'cost': '₹8.50 Cr',
      'risk': 'Medium',
      'quality': 72,
    },
    {
      'id': 'DPR-004',
      'title': 'Solar Power Plant Installation',
      'state': 'NE Region',
      'cost': '₹50.00 Cr',
      'risk': 'High',
      'quality': 65,
    },
  ];

  Map<String, String?> _decisions = {};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Approvals Queue'),
      ),
      body: Column(
        children: [
          _buildSummaryStats(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _pendingDprs.length,
              itemBuilder: (context, index) {
                final dpr = _pendingDprs[index];
                return _buildApprovalCard(dpr);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryStats() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _buildStatCard('Pending', '${_pendingDprs.length}', AppTheme.accentAmber),
          const SizedBox(width: 12),
          _buildStatCard('Approved', '12', AppTheme.accentGreen),
          const SizedBox(width: 12),
          _buildStatCard('Rejected', '3', AppTheme.accentRed),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildApprovalCard(Map<String, dynamic> dpr) {
    final id = dpr['id'] as String;
    final decision = _decisions[id];

    return Card(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(id, style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: AppTheme.accentBlue)),
                    Row(
                      children: [
                        _buildBadge('${dpr['risk']} Risk', dpr['risk'] == 'High' ? AppTheme.accentRed : AppTheme.accentAmber),
                        const SizedBox(width: 8),
                        _buildBadge('Quality: ${dpr['quality']}', AppTheme.accentGreen),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(dpr['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 8),
                Text('${dpr['state']} · ${dpr['cost']}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => setState(() => _decisions[id] = decision == 'Approve' ? null : 'Approve'),
                        icon: const Icon(Icons.check_circle_outline, size: 16),
                        label: const Text('Approve', style: TextStyle(fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: decision == 'Approve' ? Colors.white : AppTheme.accentGreen,
                          backgroundColor: decision == 'Approve' ? AppTheme.accentGreen : Colors.transparent,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => setState(() => _decisions[id] = decision == 'Reject' ? null : 'Reject'),
                        icon: const Icon(Icons.cancel_outlined, size: 16),
                        label: const Text('Reject', style: TextStyle(fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: decision == 'Reject' ? Colors.white : AppTheme.accentRed,
                          backgroundColor: decision == 'Reject' ? AppTheme.accentRed : Colors.transparent,
                        ),
                      ),
                    ),
                  ],
                ),
                if (decision != null) ...[
                  const SizedBox(height: 12),
                  TextField(
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: 'Justification for ${decision.toLowerCase()}...',
                      fillColor: AppTheme.bgPrimary.withOpacity(0.5),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () {},
                    child: Text('Confirm ${decision}al'),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }
}
