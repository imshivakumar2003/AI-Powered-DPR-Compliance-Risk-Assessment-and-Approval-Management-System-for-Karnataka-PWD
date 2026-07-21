import 'package:flutter/material.dart';
import '../../models/dpr_model.dart';
import '../../models/attachment_model.dart';

class CreateDprScreen extends StatefulWidget {
  @override
  _CreateDprScreenState createState() => _CreateDprScreenState();
}

class _CreateDprScreenState extends State<CreateDprScreen> {
  int _currentStep = 0;
  final _formKeys = [GlobalKey<FormState>(), GlobalKey<FormState>(), GlobalKey<FormState>(), GlobalKey<FormState>()];

  // Step 1: Basic Info
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _clientCtrl = TextEditingController();
  final _managerCtrl = TextEditingController();
  String _department = 'Software Development';
  String _category = 'Private';

  // Step 2: Timeline & Budget
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(Duration(days: 180));
  final _budgetCtrl = TextEditingController();
  String _priority = 'Medium';

  // Step 3: Details
  final _objectivesCtrl = TextEditingController();
  final _scopeCtrl = TextEditingController();
  final _methodologyCtrl = TextEditingController();
  final _remarksCtrl = TextEditingController();

  // Step 4: Team & Attachments
  List<String> _teamMembers = [];
  final _memberCtrl = TextEditingController();
  List<AttachmentModel> _attachments = [];
  final _filePathCtrl = TextEditingController();

  final _departments = ['Software Development', 'Infrastructure', 'Healthcare IT', 'Energy', 'FinTech', 'Other'];
  final _categories = ['Government', 'Private', 'Healthcare', 'Renewable Energy', 'Banking', 'Education', 'Other'];
  final _priorities = ['Low', 'Medium', 'High', 'Critical'];

  String _formatDate(DateTime d) {
    final m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${d.day} ${m[d.month - 1]} ${d.year}';
  }

  Future<void> _pickDate(BuildContext ctx, bool isStart) async {
    final picked = await showDatePicker(context: ctx, initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime(2020), lastDate: DateTime(2030));
    if (picked != null) setState(() { if (isStart) _startDate = picked; else _endDate = picked; });
  }

  void _addTeamMember() {
    final name = _memberCtrl.text.trim();
    if (name.isNotEmpty) { setState(() { _teamMembers.add(name); _memberCtrl.clear(); }); }
  }

  /// Add attachment by entering a file path manually
  void _addFileByPath() {
    final path = _filePathCtrl.text.trim();
    if (path.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please enter a file path')));
      return;
    }
    // Check for duplicate paths
    if (_attachments.any((a) => a.filePath == path)) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('File already attached')));
      return;
    }
    setState(() {
      _attachments.add(AttachmentModel.fromFilePath(path));
      _filePathCtrl.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('File attached successfully')));
  }

  /// Show a dialog with predefined mock file paths for quick testing
  void _showMockFileDialog() {
    final mockPaths = [
      'C:\\Projects\\DPR\\proposal.pdf',
      'C:\\Projects\\DPR\\budget_sheet.xlsx',
      'C:\\Projects\\DPR\\requirements.docx',
      'C:\\Projects\\DPR\\architecture_diagram.png',
      'C:\\Projects\\DPR\\timeline.pdf',
      'C:\\Projects\\DPR\\presentation.pptx',
      'C:\\Projects\\DPR\\data_analysis.csv',
    ];
    final available = mockPaths.where((p) => !_attachments.any((a) => a.filePath == p)).toList();

    if (available.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('All mock files already attached')));
      return;
    }

    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: Text('Select Mock File'),
      content: SizedBox(width: double.maxFinite, child: ListView.builder(
        shrinkWrap: true, itemCount: available.length,
        itemBuilder: (c, i) {
          final path = available[i];
          final att = AttachmentModel.fromFilePath(path);
          return ListTile(
            leading: Icon(_getFileIcon(att.fileExtension), color: _getFileColor(att.fileExtension)),
            title: Text(att.fileName, style: TextStyle(fontWeight: FontWeight.w500)),
            subtitle: Text(path, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
            onTap: () {
              setState(() { _attachments.add(AttachmentModel.fromFilePath(path)); });
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${att.fileName} attached')));
            },
          );
        },
      )),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel'))],
    ));
  }

  IconData _getFileIcon(String ext) {
    if (ext == 'pdf') return Icons.picture_as_pdf;
    if (['xlsx', 'xls', 'csv'].contains(ext)) return Icons.table_chart;
    if (['doc', 'docx', 'txt'].contains(ext)) return Icons.description;
    if (['png', 'jpg', 'jpeg', 'gif'].contains(ext)) return Icons.image;
    if (['ppt', 'pptx'].contains(ext)) return Icons.slideshow;
    return Icons.insert_drive_file;
  }

  Color _getFileColor(String ext) {
    if (ext == 'pdf') return Colors.red;
    if (['xlsx', 'xls', 'csv'].contains(ext)) return Colors.green;
    if (['doc', 'docx', 'txt'].contains(ext)) return Colors.blue;
    if (['png', 'jpg', 'jpeg', 'gif'].contains(ext)) return Colors.purple;
    if (['ppt', 'pptx'].contains(ext)) return Colors.orange;
    return Colors.grey;
  }

  void _submitDpr() {
    final dpr = DprModel(
      id: 'DPR-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      projectTitle: _titleCtrl.text, projectDescription: _descCtrl.text,
      clientName: _clientCtrl.text, projectManager: _managerCtrl.text,
      department: _department, category: _category,
      startDate: _startDate, endDate: _endDate,
      estimatedBudget: double.tryParse(_budgetCtrl.text) ?? 0,
      status: 'Draft', priority: _priority,
      attachments: _attachments.map((a) => a.filePath).toList(),
      teamMembers: _teamMembers,
      objectives: _objectivesCtrl.text, scope: _scopeCtrl.text,
      methodology: _methodologyCtrl.text, remarks: _remarksCtrl.text,
      createdAt: DateTime.now(), updatedAt: DateTime.now(), progress: 0.0,
    );
    Navigator.pop(context, dpr);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Create New DPR'), elevation: 2),
      body: Stepper(
        type: StepperType.vertical, currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep < 3) {
            if (_formKeys[_currentStep].currentState?.validate() ?? false) {
              setState(() { _currentStep++; });
            }
          } else { _submitDpr(); }
        },
        onStepCancel: () { if (_currentStep > 0) setState(() { _currentStep--; }); },
        controlsBuilder: (ctx, details) {
          return Padding(padding: EdgeInsets.only(top: 16), child: Row(children: [
            ElevatedButton(onPressed: details.onStepContinue,
              child: Text(_currentStep == 3 ? 'Submit DPR' : 'Continue')),
            SizedBox(width: 12),
            if (_currentStep > 0) TextButton(onPressed: details.onStepCancel, child: Text('Back')),
          ]));
        },
        steps: [
          // Step 1: Basic Info
          Step(title: Text('Basic Information'), isActive: _currentStep >= 0,
            state: _currentStep > 0 ? StepState.complete : StepState.indexed,
            content: Form(key: _formKeys[0], child: Column(children: [
              TextFormField(controller: _titleCtrl, decoration: InputDecoration(labelText: 'Project Title *'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              SizedBox(height: 12),
              TextFormField(controller: _descCtrl, decoration: InputDecoration(labelText: 'Project Description *'),
                maxLines: 3, validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              SizedBox(height: 12),
              TextFormField(controller: _clientCtrl, decoration: InputDecoration(labelText: 'Client Name *'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              SizedBox(height: 12),
              TextFormField(controller: _managerCtrl, decoration: InputDecoration(labelText: 'Project Manager *'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              SizedBox(height: 12),
              DropdownButtonFormField<String>(value: _department, decoration: InputDecoration(labelText: 'Department'),
                items: _departments.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                onChanged: (v) => setState(() { _department = v!; })),
              SizedBox(height: 12),
              DropdownButtonFormField<String>(value: _category, decoration: InputDecoration(labelText: 'Category'),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (v) => setState(() { _category = v!; })),
            ]))),

          // Step 2: Timeline & Budget
          Step(title: Text('Timeline & Budget'), isActive: _currentStep >= 1,
            state: _currentStep > 1 ? StepState.complete : StepState.indexed,
            content: Form(key: _formKeys[1], child: Column(children: [
              ListTile(contentPadding: EdgeInsets.zero, title: Text('Start Date'), subtitle: Text(_formatDate(_startDate)),
                trailing: Icon(Icons.calendar_today), onTap: () => _pickDate(context, true)),
              ListTile(contentPadding: EdgeInsets.zero, title: Text('End Date'), subtitle: Text(_formatDate(_endDate)),
                trailing: Icon(Icons.calendar_today), onTap: () => _pickDate(context, false)),
              SizedBox(height: 12),
              TextFormField(controller: _budgetCtrl, decoration: InputDecoration(labelText: 'Estimated Budget (₹) *', prefixText: '₹ '),
                keyboardType: TextInputType.number, validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              SizedBox(height: 12),
              DropdownButtonFormField<String>(value: _priority, decoration: InputDecoration(labelText: 'Priority'),
                items: _priorities.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                onChanged: (v) => setState(() { _priority = v!; })),
            ]))),

          // Step 3: Project Details
          Step(title: Text('Project Details'), isActive: _currentStep >= 2,
            state: _currentStep > 2 ? StepState.complete : StepState.indexed,
            content: Form(key: _formKeys[2], child: Column(children: [
              TextFormField(controller: _objectivesCtrl, decoration: InputDecoration(labelText: 'Objectives'), maxLines: 3),
              SizedBox(height: 12),
              TextFormField(controller: _scopeCtrl, decoration: InputDecoration(labelText: 'Scope'), maxLines: 3),
              SizedBox(height: 12),
              TextFormField(controller: _methodologyCtrl, decoration: InputDecoration(labelText: 'Methodology'), maxLines: 3),
              SizedBox(height: 12),
              TextFormField(controller: _remarksCtrl, decoration: InputDecoration(labelText: 'Remarks'), maxLines: 2),
            ]))),

          // Step 4: Team & Attachments (with File Path Input)
          Step(title: Text('Team & Attachments'), isActive: _currentStep >= 3,
            state: _currentStep > 3 ? StepState.complete : StepState.indexed,
            content: Form(key: _formKeys[3], child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // --- Team Members Section ---
              Text('Team Members', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              SizedBox(height: 8),
              Row(children: [
                Expanded(child: TextField(controller: _memberCtrl, decoration: InputDecoration(hintText: 'Enter member name'))),
                SizedBox(width: 8),
                IconButton(onPressed: _addTeamMember, icon: Icon(Icons.add_circle, color: Colors.blue, size: 32)),
              ]),
              SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 4, children: _teamMembers.map((m) => Chip(
                label: Text(m), deleteIcon: Icon(Icons.close, size: 16),
                onDeleted: () => setState(() { _teamMembers.remove(m); }))).toList()),

              SizedBox(height: 24),

              // --- File Attachments Section ---
              Text('Attachments', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              SizedBox(height: 4),
              Text('Enter the full file path to attach documents to this DPR.',
                style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              SizedBox(height: 12),

              // File Path Input Field
              TextField(
                controller: _filePathCtrl,
                decoration: InputDecoration(
                  labelText: 'File Path',
                  hintText: 'e.g. C:\\Documents\\report.pdf',
                  prefixIcon: Icon(Icons.folder_open),
                  suffixIcon: IconButton(
                    icon: Icon(Icons.add_circle, color: Colors.blue),
                    onPressed: _addFileByPath,
                    tooltip: 'Attach this file',
                  ),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onSubmitted: (_) => _addFileByPath(),
              ),
              SizedBox(height: 8),

              // Quick-add mock files button
              OutlinedButton.icon(
                onPressed: _showMockFileDialog,
                icon: Icon(Icons.snippet_folder),
                label: Text('Browse Sample Files'),
              ),
              SizedBox(height: 12),

              // Attached Files List
              if (_attachments.isNotEmpty) ...[
                Text('${_attachments.length} file(s) attached:', style: TextStyle(fontSize: 13, color: Colors.grey[700])),
                SizedBox(height: 8),
                ..._attachments.map((att) => Card(
                  margin: EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(_getFileIcon(att.fileExtension), color: _getFileColor(att.fileExtension), size: 32),
                    title: Text(att.fileName, style: TextStyle(fontWeight: FontWeight.w500)),
                    subtitle: Text(att.filePath, style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                      overflow: TextOverflow.ellipsis, maxLines: 1),
                    trailing: IconButton(
                      icon: Icon(Icons.remove_circle_outline, color: Colors.red, size: 20),
                      onPressed: () => setState(() { _attachments.remove(att); }),
                      tooltip: 'Remove',
                    ),
                  ),
                )),
              ],
            ]))),
        ],
      ),
    );
  }
}
