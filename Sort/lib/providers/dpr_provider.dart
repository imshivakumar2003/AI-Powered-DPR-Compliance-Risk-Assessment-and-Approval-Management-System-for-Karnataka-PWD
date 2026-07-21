import 'package:flutter/material.dart';
import '../models/dpr_model.dart';

class DprProvider extends ChangeNotifier {
  List<DprModel> _allDprs = getMockDprList();
  String _selectedStatus = 'All';
  String _searchQuery = '';

  List<DprModel> get allDprs => _allDprs;

  List<DprModel> get filteredDprs {
    return _allDprs.where((dpr) {
      final matchesStatus = _selectedStatus == 'All' || dpr.status == _selectedStatus;
      final matchesSearch = _searchQuery.isEmpty ||
          dpr.projectTitle.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          dpr.clientName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          dpr.id.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    }).toList();
  }

  int get pendingCount => _allDprs.where((d) => d.status == 'Under Review' || d.status == 'Submitted').length;
  int get approvedCount => _allDprs.where((d) => d.status == 'Approved').length;
  int get highRiskCount => 18; // Mocked for now to match analytics

  void setStatusFilter(String status) {
    _selectedStatus = status;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void addDpr(DprModel dpr) {
    _allDprs.add(dpr);
    notifyListeners();
  }

  void deleteDpr(String id) {
    _allDprs.removeWhere((d) => d.id == id);
    notifyListeners();
  }
}
