import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class AiRecommendationsScreen extends StatefulWidget {
  const AiRecommendationsScreen({super.key});

  @override
  State<AiRecommendationsScreen> createState() => _AiRecommendationsScreenState();
}

class _AiRecommendationsScreenState extends State<AiRecommendationsScreen> {
  String _selectedPriority = 'All';
  String _selectedCategory = 'All';

  final List<String> _priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  final List<String> _categories = ['All', 'Technical', 'Financial', 'Environmental', 'Timeline', 'Procurement'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Recommendations'),
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          _buildSummaryBanner(),
          _buildFilterChips(),
          Expanded(
            child: _buildRecommendationsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryBanner() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.accentPurple.withOpacity(0.15), AppTheme.accentBlue.withOpacity(0.15)],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.accentPurple.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lightbulb, color: AppTheme.accentPurple),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: const TextSpan(
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    children: [
                      TextSpan(text: '10 recommendations ', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold)),
                      TextSpan(text: 'generated across '),
                      TextSpan(text: '5 DPRs', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold)),
                      TextSpan(text: '. Suggestions are AI-generated based on NE regional compliance.'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    return Column(
      children: [
        SizedBox(
          height: 50,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _priorities.length,
            itemBuilder: (context, index) {
              final p = _priorities[index];
              final isSelected = _selectedPriority == p;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(p),
                  selected: isSelected,
                  onSelected: (val) => setState(() => _selectedPriority = p),
                  selectedColor: AppTheme.accentBlue.withOpacity(0.2),
                  checkmarkColor: AppTheme.accentBlue,
                ),
              );
            },
          ),
        ),
        SizedBox(
          height: 50,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _categories.length,
            itemBuilder: (context, index) {
              final c = _categories[index];
              final isSelected = _selectedCategory == c;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(c),
                  selected: isSelected,
                  onSelected: (val) => setState(() => _selectedCategory = c),
                  selectedColor: AppTheme.accentPurple.withOpacity(0.2),
                  checkmarkColor: AppTheme.accentPurple,
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildRecommendationsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        final priority = index == 0 ? 'CRITICAL' : index == 1 ? 'HIGH' : 'MEDIUM';
        final color = index == 0 ? AppTheme.accentRed : index == 1 ? AppTheme.accentAmber : AppTheme.accentBlue;
        
        return Card(
          child: ExpansionTile(
            leading: Icon(Icons.lightbulb_outline, color: color),
            title: Text('Rec #00${index + 1}', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  index == 0 ? 'Critical: Geological Data Missing' : 'Optimize Timeline for Monsoon',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _buildSmallBadge(priority, color),
                    const SizedBox(width: 8),
                    _buildSmallBadge('Technical', AppTheme.accentPurple),
                  ],
                ),
              ],
            ),
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Divider(),
                    const Text(
                      'AI Insight: Based on historical landslide data in the project stretch, a LiDAR-based topographic survey is mandatory for compliance with regional safety norms.',
                      style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    const Text('Actionable Steps:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 8),
                    _buildStep(1, 'Commission LiDAR survey for Section B'),
                    _buildStep(2, 'Update risk mitigation plan'),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () {},
                      child: const Text('View Project Details'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSmallBadge(String text, Color color) {
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

  Widget _buildStep(int num, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$num. ', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentBlue)),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
        ],
      ),
    );
  }
}
