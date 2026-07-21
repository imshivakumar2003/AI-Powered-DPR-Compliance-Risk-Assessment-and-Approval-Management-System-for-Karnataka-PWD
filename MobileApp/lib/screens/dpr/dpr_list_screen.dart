import 'package:flutter/material.dart';
import '../../models/dpr_model.dart';
import 'dpr_detail_screen.dart';
import 'create_dpr_screen.dart';

class DprListScreen extends StatefulWidget {
  @override
  _DprListScreenState createState() => _DprListScreenState();
}

class _DprListScreenState extends State<DprListScreen> {
  List<DprModel> _allDprs = getMockDprList();
  List<DprModel> _filteredDprs = [];
  String _selectedStatus = 'All';
  String _searchQuery = '';
  String _sortBy = 'Date (Newest)';

  final List<String> _statusFilters = ['All', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'];
  final List<String> _sortOptions = ['Date (Newest)', 'Date (Oldest)', 'Title (A-Z)', 'Budget (High-Low)', 'Priority'];

  @override
  void initState() {
    super.initState();
    _applyFilters();
  }

  void _applyFilters() {
    setState(() {
      _filteredDprs = _allDprs.where((dpr) {
        final matchesStatus = _selectedStatus == 'All' || dpr.status == _selectedStatus;
        final matchesSearch = _searchQuery.isEmpty ||
            dpr.projectTitle.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            dpr.clientName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            dpr.id.toLowerCase().contains(_searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      }).toList();
      switch (_sortBy) {
        case 'Date (Newest)': _filteredDprs.sort((a, b) => b.createdAt.compareTo(a.createdAt)); break;
        case 'Date (Oldest)': _filteredDprs.sort((a, b) => a.createdAt.compareTo(b.createdAt)); break;
        case 'Title (A-Z)': _filteredDprs.sort((a, b) => a.projectTitle.compareTo(b.projectTitle)); break;
        case 'Budget (High-Low)': _filteredDprs.sort((a, b) => b.estimatedBudget.compareTo(a.estimatedBudget)); break;
        case 'Priority':
          final po = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3};
          _filteredDprs.sort((a, b) => (po[a.priority] ?? 4).compareTo(po[b.priority] ?? 4));
          break;
      }
    });
  }

  Color _getStatusColor(String s) {
    switch (s) { case 'Draft': return Colors.grey; case 'Submitted': return Colors.blue; case 'Under Review': return Colors.orange; case 'Approved': return Colors.green; case 'Rejected': return Colors.red; default: return Colors.grey; }
  }

  IconData _getStatusIcon(String s) {
    switch (s) { case 'Draft': return Icons.edit_note; case 'Submitted': return Icons.send; case 'Under Review': return Icons.hourglass_top; case 'Approved': return Icons.check_circle; case 'Rejected': return Icons.cancel; default: return Icons.help; }
  }

  Color _getPriorityColor(String p) {
    switch (p) { case 'Critical': return Colors.red[900]!; case 'High': return Colors.orange[800]!; case 'Medium': return Colors.amber[700]!; case 'Low': return Colors.green; default: return Colors.grey; }
  }

  String _formatBudget(double a) {
    if (a >= 10000000) return '₹${(a / 10000000).toStringAsFixed(2)} Cr';
    if (a >= 100000) return '₹${(a / 100000).toStringAsFixed(2)} L';
    return '₹${a.toStringAsFixed(0)}';
  }

  String _formatDate(DateTime d) {
    final m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${d.day} ${m[d.month - 1]} ${d.year}';
  }

  void _deleteDpr(String id) {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: Text('Delete DPR'), content: Text('Are you sure? This cannot be undone.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel')),
        ElevatedButton(onPressed: () { setState(() { _allDprs.removeWhere((d) => d.id == id); }); _applyFilters(); Navigator.pop(ctx);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('DPR deleted'))); },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red), child: Text('Delete', style: TextStyle(color: Colors.white))),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Project Reports'), elevation: 2, actions: [
        PopupMenuButton<String>(icon: Icon(Icons.sort), tooltip: 'Sort', onSelected: (v) { _sortBy = v; _applyFilters(); },
          itemBuilder: (c) => _sortOptions.map((o) => PopupMenuItem(value: o, child: Row(children: [
            if (_sortBy == o) Icon(Icons.check, size: 18, color: Colors.blue) else SizedBox(width: 18), SizedBox(width: 8), Text(o)]))).toList()),
      ]),
      body: Column(children: [
        Padding(padding: EdgeInsets.all(12), child: TextField(
          decoration: InputDecoration(hintText: 'Search by title, client, or ID...', prefixIcon: Icon(Icons.search),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)), contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
          onChanged: (v) { _searchQuery = v; _applyFilters(); })),
        SizedBox(height: 48, child: ListView.builder(scrollDirection: Axis.horizontal, padding: EdgeInsets.symmetric(horizontal: 12),
          itemCount: _statusFilters.length, itemBuilder: (c, i) {
            final f = _statusFilters[i]; final sel = _selectedStatus == f;
            final cnt = f == 'All' ? _allDprs.length : _allDprs.where((d) => d.status == f).length;
            return Padding(padding: EdgeInsets.only(right: 8), child: FilterChip(label: Text('$f ($cnt)'), selected: sel,
              onSelected: (_) { _selectedStatus = f; _applyFilters(); },
              selectedColor: f == 'All' ? Colors.blue[100] : _getStatusColor(f).withOpacity(0.2)));
          })),
        SizedBox(height: 8),
        Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Row(children: [
          Text('${_filteredDprs.length} report(s) found', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
          Spacer(), Text('Sorted: $_sortBy', style: TextStyle(color: Colors.grey[600], fontSize: 13))])),
        SizedBox(height: 8),
        Expanded(child: _filteredDprs.isEmpty
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.folder_open, size: 64, color: Colors.grey[400]), SizedBox(height: 16),
              Text('No reports found', style: TextStyle(fontSize: 18, color: Colors.grey[600]))]))
          : ListView.builder(padding: EdgeInsets.symmetric(horizontal: 12), itemCount: _filteredDprs.length,
              itemBuilder: (c, i) => _buildDprCard(_filteredDprs[i]))),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final newDpr = await Navigator.push<DprModel>(context, MaterialPageRoute(builder: (c) => CreateDprScreen()));
          if (newDpr != null) { setState(() { _allDprs.add(newDpr); }); _applyFilters();
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('DPR created successfully!'))); }
        }, icon: Icon(Icons.add), label: Text('New Report')),
    );
  }

  Widget _buildDprCard(DprModel dpr) {
    return Card(margin: EdgeInsets.only(bottom: 12), elevation: 2, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (c) => DprDetailScreen(dpr: dpr))),
        child: Padding(padding: EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(6)),
              child: Text(dpr.id, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[700]))),
            SizedBox(width: 8),
            Container(padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: _getPriorityColor(dpr.priority).withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
              child: Text(dpr.priority, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _getPriorityColor(dpr.priority)))),
            Spacer(),
            Container(padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: _getStatusColor(dpr.status).withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(_getStatusIcon(dpr.status), size: 14, color: _getStatusColor(dpr.status)), SizedBox(width: 4),
                Text(dpr.status, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _getStatusColor(dpr.status)))])),
          ]),
          SizedBox(height: 12),
          Text(dpr.projectTitle, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold), maxLines: 2, overflow: TextOverflow.ellipsis),
          SizedBox(height: 4),
          Text(dpr.projectDescription, style: TextStyle(fontSize: 13, color: Colors.grey[600]), maxLines: 2, overflow: TextOverflow.ellipsis),
          SizedBox(height: 12),
          Row(children: [
            Icon(Icons.person_outline, size: 16, color: Colors.grey[500]), SizedBox(width: 4),
            Expanded(child: Text(dpr.clientName, style: TextStyle(fontSize: 13, color: Colors.grey[700]), overflow: TextOverflow.ellipsis)),
            Icon(Icons.currency_rupee, size: 16, color: Colors.grey[500]), SizedBox(width: 2),
            Text(_formatBudget(dpr.estimatedBudget), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey[700]))]),
          SizedBox(height: 8),
          Row(children: [
            Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(value: dpr.progress, backgroundColor: Colors.grey[200],
                color: dpr.progress > 0.7 ? Colors.green : dpr.progress > 0.3 ? Colors.orange : Colors.blue, minHeight: 6))),
            SizedBox(width: 8),
            Text('${(dpr.progress * 100).toInt()}%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey[600]))]),
          SizedBox(height: 8),
          Row(children: [
            Icon(Icons.calendar_today, size: 14, color: Colors.grey[500]), SizedBox(width: 4),
            Text(_formatDate(dpr.createdAt), style: TextStyle(fontSize: 12, color: Colors.grey[500])),
            SizedBox(width: 16), Icon(Icons.attach_file, size: 14, color: Colors.grey[500]), SizedBox(width: 2),
            Text('${dpr.attachments.length}', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
            SizedBox(width: 16), Icon(Icons.group, size: 14, color: Colors.grey[500]), SizedBox(width: 2),
            Text('${dpr.teamMembers.length}', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
            Spacer(),
            IconButton(icon: Icon(Icons.delete_outline, size: 20, color: Colors.red[300]), onPressed: () => _deleteDpr(dpr.id),
              padding: EdgeInsets.zero, constraints: BoxConstraints(), tooltip: 'Delete')]),
        ]))));
  }
}
