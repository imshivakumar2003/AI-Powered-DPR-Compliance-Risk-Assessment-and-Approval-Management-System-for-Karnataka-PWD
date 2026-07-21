import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/dpr_model.dart';
import '../../theme/app_theme.dart';
import '../../providers/dpr_provider.dart';
import 'dpr_detail_screen.dart';
import 'create_dpr_screen.dart';

class DprListScreen extends StatefulWidget {
  const DprListScreen({super.key});

  @override
  State<DprListScreen> createState() => _DprListScreenState();
}

class _DprListScreenState extends State<DprListScreen> {
  final List<String> _statusFilters = ['All', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'];

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

  IconData _getStatusIcon(String s) {
    switch (s) {
      case 'Draft': return Icons.edit_note;
      case 'Submitted': return Icons.send;
      case 'Under Review': return Icons.hourglass_top;
      case 'Approved': return Icons.check_circle;
      case 'Rejected': return Icons.cancel;
      default: return Icons.help;
    }
  }

  String _formatBudget(double a) {
    if (a >= 10000000) return '₹${(a / 10000000).toStringAsFixed(2)} Cr';
    if (a >= 100000) return '₹${(a / 100000).toStringAsFixed(2)} L';
    return '₹${a.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final dprProvider = Provider.of<DprProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('DPR Queue'),
        actions: [
          IconButton(icon: const Icon(Icons.sort), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: dprProvider.setSearchQuery,
              decoration: const InputDecoration(
                hintText: 'Search by title, client, or ID...',
                prefixIcon: Icon(Icons.search, size: 20),
              ),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _statusFilters.length,
              itemBuilder: (context, index) {
                final f = _statusFilters[index];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f, style: const TextStyle(fontSize: 12)),
                    selected: false, // Handle selection in provider later if needed
                    onSelected: (val) => dprProvider.setStatusFilter(f),
                    selectedColor: AppTheme.accentBlue.withOpacity(0.2),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: dprProvider.filteredDprs.isEmpty
                ? const Center(child: Text('No project reports found'))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: dprProvider.filteredDprs.length,
                    itemBuilder: (context, index) {
                      final dpr = dprProvider.filteredDprs[index];
                      return _buildDprCard(context, dpr, index);
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final newDpr = await Navigator.push<DprModel>(context, MaterialPageRoute(builder: (c) => CreateDprScreen()));
          if (newDpr != null) {
            dprProvider.addDpr(newDpr);
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('DPR created successfully!')));
            }
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('New Report'),
        backgroundColor: AppTheme.accentBlue,
      ),
    );
  }

  Widget _buildDprCard(BuildContext context, DprModel dpr, int index) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (c) => DprDetailScreen(dpr: dpr))),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(dpr.id, style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: AppTheme.accentBlue, fontWeight: FontWeight.bold)),
                  _buildStatusBadge(dpr.status),
                ],
              ),
              const SizedBox(height: 12),
              Text(dpr.projectTitle, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(dpr.projectDescription, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(Icons.business_outlined, size: 14, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Expanded(child: Text(dpr.clientName, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
                  const Icon(Icons.currency_rupee, size: 14, color: AppTheme.textMuted),
                  const SizedBox(width: 2),
                  Text(_formatBudget(dpr.estimatedBudget), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: dpr.progress,
                  minHeight: 4,
                  backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation<Color>(dpr.progress > 0.7 ? AppTheme.accentGreen : AppTheme.accentBlue),
                ),
              ),
            ],
          ),
        ),
      ).animate().fadeIn(delay: (50 * index).ms).slideX(begin: 0.1, end: 0),
    );
  }

  Widget _buildStatusBadge(String status) {
    final color = _getStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getStatusIcon(status), size: 12, color: color),
          const SizedBox(width: 4),
          Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
