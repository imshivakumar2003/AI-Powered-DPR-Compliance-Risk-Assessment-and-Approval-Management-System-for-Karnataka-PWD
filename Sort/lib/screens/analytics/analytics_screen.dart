import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../theme/app_theme.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics Dashboard'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildKpiGrid(),
            const SizedBox(height: 24),
            _buildSectionTitle('DPR Submission Trends'),
            const SizedBox(height: 12),
            _buildTrendChart(),
            const SizedBox(height: 24),
            _buildSectionTitle('Sector Breakdown'),
            const SizedBox(height: 12),
            _buildSectorChart(),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary));
  }

  Widget _buildKpiGrid() {
    final kpis = [
      {'label': 'Total DPRs', 'value': '524', 'icon': Icons.file_copy_outlined, 'color': AppTheme.accentBlue},
      {'label': 'Pending', 'value': '42', 'icon': Icons.timer_outlined, 'color': AppTheme.accentAmber},
      {'label': 'High Risk', 'value': '18', 'icon': Icons.warning_amber_outlined, 'color': AppTheme.accentRed},
      {'label': 'Approved', 'value': '67', 'icon': Icons.check_circle_outline, 'color': AppTheme.accentGreen},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.5,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: kpis.length,
      itemBuilder: (context, index) {
        final kpi = kpis[index];
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(kpi['icon'] as IconData, size: 20, color: kpi['color'] as Color),
                const SizedBox(height: 8),
                Text(kpi['value'] as String, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                Text(kpi['label'] as String, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTrendChart() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 200,
          child: LineChart(
            LineChartData(
              gridData: const FlGridData(show: false),
              titlesData: const FlTitlesData(show: false),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: const [
                    FlSpot(0, 3),
                    FlSpot(1, 1),
                    FlSpot(2, 4),
                    FlSpot(3, 2),
                    FlSpot(4, 5),
                    FlSpot(5, 3),
                  ],
                  isCurved: true,
                  color: AppTheme.accentBlue,
                  barWidth: 3,
                  isStrokeCapRound: true,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(show: true, color: AppTheme.accentBlue.withOpacity(0.1)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectorChart() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 200,
          child: PieChart(
            PieChartData(
              sectionsSpace: 4,
              centerSpaceRadius: 40,
              sections: [
                PieChartSectionData(value: 40, title: 'Infra', color: AppTheme.accentBlue, radius: 50, titleStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                PieChartSectionData(value: 30, title: 'Energy', color: AppTheme.accentGreen, radius: 50, titleStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                PieChartSectionData(value: 15, title: 'Health', color: AppTheme.accentPurple, radius: 50, titleStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                PieChartSectionData(value: 15, title: 'IT', color: AppTheme.accentAmber, radius: 50, titleStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
