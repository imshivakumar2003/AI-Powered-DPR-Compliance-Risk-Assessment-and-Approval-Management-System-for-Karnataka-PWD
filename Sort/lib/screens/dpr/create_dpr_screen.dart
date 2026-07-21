import 'package:flutter/material.dart';
import '../../models/dpr_model.dart';
import '../../models/attachment_model.dart';
import '../../theme/app_theme.dart';

class CreateDprScreen extends StatefulWidget {
  const CreateDprScreen({super.key});

  @override
  State<CreateDprScreen> createState() => _CreateDprScreenState();
}

class _CreateDprScreenState extends State<CreateDprScreen> {
  int _currentStep = 0;
  final _formKeys = [GlobalKey<FormState>(), GlobalKey<FormState>(), GlobalKey<FormState>(), GlobalKey<FormState>()];

  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _clientCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  String _priority = 'Medium';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Project Report')),
      body: Stepper(
        type: StepperType.vertical,
        currentStep: _currentStep,
        elevation: 0,
        connectorColor: const MaterialStatePropertyAll(AppTheme.accentBlue),
        onStepContinue: () {
          if (_currentStep < 3) {
            setState(() => _currentStep++);
          } else {
            _submit();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) setState(() => _currentStep--);
        },
        controlsBuilder: (context, details) {
          return Padding(
            padding: const EdgeInsets.only(top: 20),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: details.onStepContinue,
                    child: Text(_currentStep == 3 ? 'Finalize' : 'Next Step'),
                  ),
                ),
                if (_currentStep > 0) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: details.onStepCancel,
                      child: const Text('Back'),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
        steps: [
          Step(
            title: const Text('Core Details', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 0,
            state: _currentStep > 0 ? StepState.complete : StepState.indexed,
            content: Column(
              children: [
                _buildField(_titleCtrl, 'Project Title', Icons.title),
                const SizedBox(height: 16),
                _buildField(_descCtrl, 'Description', Icons.description, maxLines: 3),
              ],
            ),
          ),
          Step(
            title: const Text('Stakeholders', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 1,
            state: _currentStep > 1 ? StepState.complete : StepState.indexed,
            content: Column(
              children: [
                _buildField(_clientCtrl, 'Client Name', Icons.business),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _priority,
                  decoration: const InputDecoration(labelText: 'Priority Level', prefixIcon: Icon(Icons.priority_high, size: 20)),
                  items: ['Low', 'Medium', 'High', 'Critical'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                  onChanged: (v) => setState(() => _priority = v!),
                ),
              ],
            ),
          ),
          Step(
            title: const Text('Financials', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 2,
            state: _currentStep > 2 ? StepState.complete : StepState.indexed,
            content: Column(
              children: [
                _buildField(_budgetCtrl, 'Estimated Budget (₹)', Icons.currency_rupee, keyboardType: TextInputType.number),
              ],
            ),
          ),
          Step(
            title: const Text('Team & Docs', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 3,
            state: _currentStep > 3 ? StepState.complete : StepState.indexed,
            content: Column(
              children: [
                const ListTile(
                  leading: Icon(Icons.people_outline, color: AppTheme.accentBlue),
                  title: Text('Team Setup', style: TextStyle(fontSize: 13)),
                  subtitle: Text('Add members in next version', style: TextStyle(fontSize: 10)),
                ),
                const SizedBox(height: 12),
                const ListTile(
                  leading: Icon(Icons.attach_file, color: AppTheme.accentBlue),
                  title: Text('Documents', style: TextStyle(fontSize: 13)),
                  subtitle: Text('Upload paths in next version', style: TextStyle(fontSize: 10)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildField(TextEditingController ctrl, String label, IconData icon, {int maxLines = 1, TextInputType keyboardType = TextInputType.text}) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20),
      ),
    );
  }

  void _submit() {
    final dpr = DprModel(
      id: 'DPR-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      projectTitle: _titleCtrl.text,
      projectDescription: _descCtrl.text,
      clientName: _clientCtrl.text,
      projectManager: 'Admin',
      department: 'General',
      category: 'General',
      startDate: DateTime.now(),
      endDate: DateTime.now().add(const Duration(days: 365)),
      estimatedBudget: double.tryParse(_budgetCtrl.text) ?? 0,
      status: 'Submitted',
      priority: _priority,
      attachments: [],
      teamMembers: [],
      objectives: '',
      scope: '',
      methodology: '',
      remarks: '',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      progress: 0.1,
    );
    Navigator.pop(context, dpr);
  }
}
