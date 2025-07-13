import { Component } from '@angular/core';

import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule ,CdkDropList, CdkDrag, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

  list = [
    {
      title: '>35°C',
      items: ['Áo thun cotton', 'Quần short', 'Dép xăng đan', 'Mũ chống nắng'],
    },
    {
      title: '>25°C',
      items: ['Áo sơ mi', 'Quần jeans', 'Giày sneaker', 'Áo khoác nhẹ'],
    },
    {
      title: '>15°C',
      items: ['Áo len', 'Quần dài', 'Boots', 'Áo khoác dày'],
    },
    {
      title: '>5°C',
      items: ['Áo phao nhẹ', 'Quần ấm', 'Giày bốt cao', 'Khăn choàng'],
    },
    {
      title: '-5°C trở xuống',
      items: ['Áo phao dày', 'Quần bông', 'Ủng tuyết', 'Mũ len', 'Găng tay'],
    }
  ]
  
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
    
    // Kiểm tra nhiệt độ hợp lệ (bao gồm cả số âm)
    if (temperature === null || temperature === undefined) return;

    console.log('Adding new list with temperature:', temperature);

    // Tạo tiêu đề phù hợp cho nhiệt độ âm/dương
    let title: string;
    if (temperature >= 0) {
      title = `>${temperature}°C`;
    } else {
      title = `${temperature}°C trở xuống`;
    }

    const newList = {
      title: title,
      items: []
    };

    // Tìm vị trí đúng để insert (sắp xếp từ cao xuống thấp)
    let insertIndex = this.list.length;
    console.log('Current list:', this.list.map(item => item.title));
    
    for (let i = 0; i < this.list.length; i++) {
      // Lấy nhiệt độ từ title (xử lý cả số âm)
      const match = this.list[i].title.match(/(-?\d+)/);
      const currentTemp = match ? parseInt(match[1]) : 0;
      console.log(`Comparing ${temperature} with ${currentTemp} at index ${i}`);
      if (temperature > currentTemp) {
        insertIndex = i;
        console.log(`Found insert position: ${i}`);
        break;
      }
    }

    this.list.splice(insertIndex, 0, newList);

    // Reset và đóng modal
    this.newListTitle = 0;
    const modalEl = document.getElementById('addListModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  }
}
