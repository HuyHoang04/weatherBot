import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, FormsModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  private apiUrl = 'http://localhost:3978/api/suggestions';

  list = [
    {
      title: '35',
      items: ['Áo thun cotton', 'Quần short', 'Dép xăng đan', 'Mũ chống nắng'],
    },
    {
      title: '30',
      items: ['Áo sơ mi', 'Quần jeans', 'Giày sneaker', 'Áo khoác nhẹ'],
    },
    {
      title: '25',
      items: ['Áo len', 'Quần dài', 'Boots', 'Áo khoác dày'],
    },
    {
      title: '20',
      items: ['Áo phao nhẹ', 'Quần ấm', 'Giày bốt cao', 'Khăn choàng'],
    }
  ]

  constructor(private http: HttpClient) {}
  
  // Load dữ liệu từ server khi component khởi tạo
  ngOnInit() {
    console.log('Component initialized, loading suggestions...');
    this.loadSuggestionsFromServer();
  }

  // Method để reload dữ liệu từ server (có thể gọi từ button)
  reloadFromServer() {
    this.loadSuggestionsFromServer();
  }

  // Test connection to backend
  testConnection() {
    console.log('Testing connection to backend...');
    this.http.get(`${this.apiUrl}`, { observe: 'response' })
      .subscribe({
        next: (response) => {
          console.log('Connection successful:', response);
          alert('Kết nối backend thành công!');
        },
        error: (error) => {
          console.error('Connection failed:', error);
          if (error.status === 0) {
            alert('Không thể kết nối đến backend. Vui lòng kiểm tra:\n1. Backend có đang chạy?\n2. URL có đúng không?\n3. CORS có được cấu hình đúng?');
          } else {
            alert(`Lỗi kết nối: ${error.status} - ${error.message}`);
          }
        }
      });
  }

  // Load suggestions từ server
  loadSuggestionsFromServer() {
    console.log('Starting to load suggestions from server...');
    
    this.http.get<any[]>(`${this.apiUrl}`)
      .subscribe({
        next: (suggestions) => {
          console.log('Loaded suggestions from server:', suggestions);
          console.log('Type of suggestions:', typeof suggestions);
          console.log('Is array:', Array.isArray(suggestions));
          
          if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
            // Backend trả về array suggestions trực tiếp
            this.list = suggestions.map((item: any) => ({
              title: item.temperature.toString(),
              items: [...(item.items || [])] // Copy array
            }));
            
            // Sắp xếp theo nhiệt độ giảm dần (backend đã sắp xếp rồi)
            console.log('Updated list from server:', this.list);
            alert(`Đã load ${suggestions.length} gợi ý từ server thành công!`);
          } else {
            console.log('No suggestions found on server, keeping default data');
            alert('Không có dữ liệu trên server, sử dụng dữ liệu mặc định');
          }
        },
        error: (error) => {
          console.error('Error loading suggestions from server:', error);
          alert('Lỗi khi load dữ liệu từ server: ' + error.message);
          // Giữ nguyên dữ liệu mặc định nếu không load được
        }
      });
  }

  get dropListIds(): string[] {
    return this.list.map((_, i) => 'dropList' + i);
  }

  get connectedDropLists() {
    return this.list.map((_, i) => 'dropList' + i);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
    currentGroup: any = null;
    newItemText = '';
    newListTitle: number = 0;
    
    openAddItem(group: any) {
      this.currentGroup = group;
      this.newItemText = '';

      const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
      modal.show();
    }

    confirmAddItem(event: Event) {
      event.preventDefault();
      const content = this.newItemText.trim();
      if (!content || !this.currentGroup) return;

      this.currentGroup.items.push(content);

      // Tự động lưu gợi ý cho khoảng nhiệt độ này
      this.saveSuggestionForGroup(this.currentGroup);

      // Reset
      this.newItemText = '';
      this.currentGroup = null;

      const modalEl = document.getElementById('addItemModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    }

    // Thêm danh sách nhiệt độ mới
    addNewTemperatureList() {
      this.newListTitle = 0;
      const modal = new bootstrap.Modal(document.getElementById('addListModal'));
      modal.show();
    }

    confirmAddList(event: Event) {
      event.preventDefault();
      const temperature = this.newListTitle;
      if (!temperature || temperature <= 0) return;

      console.log('Adding new list with temperature:', temperature);

      const newList = {
        title: temperature.toString(),
        items: []
      };

      // Tìm vị trí đúng để insert (sắp xếp từ cao xuống thấp)
      let insertIndex = this.list.length;
      console.log('Current list:', this.list.map(item => item.title));
      
      for (let i = 0; i < this.list.length; i++) {
        const currentTemp = parseInt(this.list[i].title);
        console.log(`Comparing ${temperature} with ${currentTemp} at index ${i}`);
        if (temperature > currentTemp) {
          insertIndex = i;
          console.log(`Found insert position: ${i}`);
          break;
        }
      }

      console.log('Inserting at index:', insertIndex);
      
      // Insert vào vị trí đúng
      this.list.splice(insertIndex, 0, newList);
      
      console.log('Updated list:', this.list.map(item => item.title));

      // Reset và đóng modal
      this.newListTitle = 0;
      const modalEl = document.getElementById('addListModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    }

    // Lưu tất cả gợi ý lên server
    saveAllSuggestions() {
      console.log('Saving all suggestions to server...');
      
      // Chuyển đổi format frontend sang backend
      const backendSuggestions = this.list.map(item => ({
        id: `temp_${item.title}`,
        temperature: parseInt(item.title),
        items: item.items
      }));
      
      this.http.post(`${this.apiUrl}`, backendSuggestions)
        .subscribe({
          next: (response: any) => {
            alert('Tất cả gợi ý đã được lưu thành công!');
            console.log('All suggestions saved successfully:', response);
          },
          error: (error) => {
            alert('Có lỗi xảy ra khi lưu gợi ý!');
            console.error('Error saving suggestions:', error);
          }
        });
    }

    // Lưu một gợi ý cụ thể lên server (khi thêm item mới)
    private saveSuggestionForGroup(group: any) {
      const backendSuggestion = {
        id: `temp_${group.title}`,
        temperature: parseInt(group.title),
        items: group.items
      };

      this.http.post(this.apiUrl, [backendSuggestion])
        .subscribe({
          next: () => {
            console.log(`Suggestion for ${group.title}°C saved successfully`);
          },
          error: (error) => {
            console.error(`Error saving suggestion for ${group.title}°C:`, error);
          }
        });
    }

    // Xóa một item khỏi group
    deleteItem(group: any, item: string, event: Event) {
      // Ngăn drag event khi click nút xóa
      event.stopPropagation();
      
      if (confirm(`Bạn có chắc muốn xóa "${item}" khỏi nhóm ${group.title}°C?`)) {
        const index = group.items.indexOf(item);
        if (index > -1) {
          group.items.splice(index, 1);
          
          // Tự động lưu lên server sau khi xóa
          this.saveSuggestionForGroup(group);
          
          console.log(`Deleted item "${item}" from group ${group.title}°C`);
        }
      }
    }

    // Xóa toàn bộ group nhiệt độ
    deleteGroup(group: any) {
      if (confirm(`Bạn có chắc muốn xóa toàn bộ nhóm ${group.title}°C và tất cả gợi ý trong đó?`)) {
        const index = this.list.indexOf(group);
        if (index > -1) {
          this.list.splice(index, 1);
          
          // Xóa khỏi database
          this.deleteGroupFromServer(group.title);
          
          console.log(`Deleted group ${group.title}°C`);
        }
      }
    }

    // Xóa group khỏi server
    private deleteGroupFromServer(temperature: string) {
      const deleteUrl = `${this.apiUrl}/${temperature}`;
      
      this.http.delete(deleteUrl)
        .subscribe({
          next: () => {
            console.log(`Group ${temperature}°C deleted from server successfully`);
          },
          error: (error) => {
            console.error(`Error deleting group ${temperature}°C from server:`, error);
            alert('Có lỗi khi xóa nhóm từ server!');
          }
        });
    }
  }
