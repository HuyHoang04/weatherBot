import { Component } from '@angular/core';

import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule ,CdkDropList, CdkDrag],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

  list = [
    {
      title: 'Todo',
      items: ['Get to work', 'Pick up groceries', 'Go home', 'Fall asleep'],
    }
    ,
    {
      title: 'Done',
      items: ['Get up', 'Brush teeth', 'Take a shower', 'Check e-mail', 'Walk dog'],
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
}
