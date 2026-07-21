import 'package:flutter/material.dart';
import '../../models/dpr_model.dart';

class DprDetailScreen extends StatelessWidget {
  final DprModel dpr;
  const DprDetailScreen({Key? key, required this.dpr}) : super(key: key);

  Color _getStatusColor(String s) {
    switch (s) { case 'Draft': return Colors.grey; case 'Submitted': return Colors.blue; case 'Under Review': return Colors.orange; case 'Approved': return Colors.green; case 'Rejected': return Colors.red; default: return Colors.grey; }
  }

  Color _getPriorityColor(String p) {
    switch (p) { case 'Critical': return Colors.red[900]!; case 'High': return Colors.orange[800]!; case 'Medium': return Colors.amber[700]!; case 'Low': return Colors.green; default: return Colors.grey; }
  }

  String _formatDate(DateTime d) {
    final m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${d.day} ${m[d.month - 1]} ${d.year}';
  }

  String _formatBudget(double a) {
    if (a >= 10000000) return '₹${(a / 10000000).toStringAsFixed(2)} Cr';
    if (a >= 100000) return '₹${(a / 100000).toStringAsFixed(2)} L';
    return '₹${a.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(dpr.id), elevation: 2, actions: [
        IconButton(icon: Icon(Icons.share), onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Share feature coming soon')));
        }),
        IconButton(icon: Icon(Icons.print), onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Print/Export feature coming soon')));
        }),
      ]),
      body: SingleChildScrollView(padding: EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header Card
        Card(elevation: 3, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(padding: EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: _getStatusColor(dpr.status).withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
                child: Text(dpr.status, style: TextStyle(fontWeight: FontWeight.w600, color: _getStatusColor(dpr.status)))),
              SizedBox(width: 8),
              Container(padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: _getPriorityColor(dpr.priority).withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                child: Text('${dpr.priority} Priority', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _getPriorityColor(dpr.priority)))),
            ]),
            SizedBox(height: 12),
            Text(dpr.projectTitle, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text(dpr.projectDescription, style: TextStyle(fontSize: 14, color: Colors.grey[700])),
            SizedBox(height: 16),
            // Progress
            Row(children: [
              Text('Progress: ', style: TextStyle(fontWeight: FontWeight.w600)),
              Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(value: dpr.progress, backgroundColor: Colors.grey[200],
                  color: dpr.progress > 0.7 ? Colors.green : dpr.progress > 0.3 ? Colors.orange : Colors.blue, minHeight: 8))),
              SizedBox(width: 8),
              Text('${(dpr.progress * 100).toInt()}%', style: TextStyle(fontWeight: FontWeight.bold)),
            ]),
          ]))),

        SizedBox(height: 16),

        // Project Info
        _sectionTitle('Project Information'),
        Card(elevation: 1, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(padding: EdgeInsets.all(16), child: Column(children: [
            _infoRow(Icons.business, 'Client', dpr.clientName),
            _divider(),
            _infoRow(Icons.person, 'Project Manager', dpr.projectManager),
            _divider(),
            _infoRow(Icons.apartment, 'Department', dpr.department),
            _divider(),
            _infoRow(Icons.category, 'Category', dpr.category),
            _divider(),
            _infoRow(Icons.currency_rupee, 'Estimated Budget', _formatBudget(dpr.estimatedBudget)),
          ]))),

        SizedBox(height: 16),

        // Timeline
        _sectionTitle('Timeline'),
        Card(elevation: 1, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(padding: EdgeInsets.all(16), child: Column(children: [
            _infoRow(Icons.play_arrow, 'Start Date', _formatDate(dpr.startDate)),
            _divider(),
            _infoRow(Icons.stop, 'End Date', _formatDate(dpr.endDate)),
            _divider(),
            _infoRow(Icons.access_time, 'Created', _formatDate(dpr.createdAt)),
            _divider(),
            _infoRow(Icons.update, 'Last Updated', _formatDate(dpr.updatedAt)),
          ]))),

        SizedBox(height: 16),

        // Objectives, Scope, Methodology
        if (dpr.objectives.isNotEmpty) ...[
          _sectionTitle('Objectives'),
          Card(elevation: 1, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(padding: EdgeInsets.all(16), child: Text(dpr.objectives, style: TextStyle(fontSize: 14, height: 1.5)))),
          SizedBox(height: 16),
        ],

        if (dpr.scope.isNotEmpty) ...[
          _sectionTitle('Scope'),
          Card(elevation: 1, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(padding: EdgeInsets.all(16), child: Text(dpr.scope, style: TextStyle(fontSize: 14, height: 1.5)))),
          SizedBox(height: 16),
        ],

        if (dpr.methodology.isNotEmpty) ...[
          _sectionTitle('Methodology'),
          Card(elevation: 1, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(padding: EdgeInsets.all(16), child: Text(dpr.methodology, style: TextStyle(fontSize: 14, height: 1.5)))),
          SizedBox(height: 16),
        ],

        // Team Members
        _sectionTitle('Team Members (${dpr.teamMembers.length})'),
        Card(elevation: 1, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(padding: EdgeInsets.all(16),
            child: Wrap(spacing: 8, runSpacing: 8, children: dpr.teamMembers.map((m) => Chip(
              avatar: CircleAvatar(backgroundColor: Colors.blue, child: Text(m[0], style: TextStyle(color: Colors.white, fontSize: 12))),
              label: Text(m))).toList()))),

        SizedBox(height: 16),

        // Attachments
        _sectionTitle('Attachments (${dpr.attachments.length})'),
        Card(elevation: 1, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Column(children: dpr.attachments.map((f) => ListTile(
            leading: Icon(f.endsWith('.pdf') ? Icons.picture_as_pdf : f.endsWith('.xlsx') ? Icons.table_chart : Icons.insert_drive_file,
              color: f.endsWith('.pdf') ? Colors.red : f.endsWith('.xlsx') ? Colors.green : Colors.blue),
            title: Text(f), trailing: Icon(Icons.download, color: Colors.grey),
            onTap: () { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Download mock: $f'))); },
          )).toList())),

        SizedBox(height: 16),

        // Remarks
        if (dpr.remarks.isNotEmpty) ...[
          _sectionTitle('Remarks'),
          Card(elevation: 1, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(padding: EdgeInsets.all(16), child: Text(dpr.remarks, style: TextStyle(fontSize: 14, height: 1.5, fontStyle: FontStyle.italic)))),
          SizedBox(height: 16),
        ],

        SizedBox(height: 32),
      ])),
    );
  }

  Widget _sectionTitle(String title) => Padding(
    padding: EdgeInsets.only(bottom: 8),
    child: Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue[800])));

  Widget _infoRow(IconData icon, String label, String value) => Padding(
    padding: EdgeInsets.symmetric(vertical: 4),
    child: Row(children: [
      Icon(icon, size: 20, color: Colors.blue), SizedBox(width: 12),
      SizedBox(width: 120, child: Text(label, style: TextStyle(color: Colors.grey[600]))),
      Expanded(child: Text(value, style: TextStyle(fontWeight: FontWeight.w500)))]));

  Widget _divider() => Divider(height: 16, thickness: 0.5);
}
