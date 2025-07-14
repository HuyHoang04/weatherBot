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
    this.loadSuggestionsFromServer();
  }

  // Load suggestions từ server
  loadSuggestionsFromServer() {
    this.http.get<any>(`${this.apiUrl}`)
      .subscribe({
        next: (response) => {
          console.log('Loaded suggestions from server:', response);
          if (response.suggestions && response.suggestions.length > 0) {
            // Cấu trúc mới đã đúng format frontend
            this.list = response.suggestions.map((item: any) => ({
              title: item.title,
              items: [...item.items] // Copy array
            }));
            
            // Sắp xếp theo nhiệt độ giảm dần
            this.list.sort((a, b) => parseInt(b.title) - parseInt(a.title));
            console.log('Updated list from server:', this.list);
          }
        },
        error: (error) => {
          console.error('Error loading suggestions from server:', error);
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
      
      const payload = {
        suggestions: this.list
      };
      
      this.http.post(`${this.apiUrl}/saveAll`, payload)
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

    // Lưu một gợi ý cụ thể lên server
    private saveSuggestion(temperatureId: string, suggestionText: string) {
      const payload = {
        id: temperatureId,
        message: suggestionText
      };

      return this.http.post(this.apiUrl, payload).toPromise();
    }

    saveSuggestionForGroup(group: any) {
      const suggestionText = group.items.join(', ');
      this.saveSuggestion(group.title, suggestionText)
        .then(() => {
          console.log(`Suggestion for ${group.title}°C saved successfully`);
        })
        .catch(error => {
          console.error(`Error saving suggestion for ${group.title}°C:`, error);
        });
    }
  }
