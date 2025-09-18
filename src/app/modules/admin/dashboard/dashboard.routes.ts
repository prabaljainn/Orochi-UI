import { Routes } from '@angular/router';
import { DashboardComponent } from 'app/modules/admin/dashboard/dashboard.component';
import { TaskDetailsComponent } from './task-details/task-details.component';

export default [
    {
        path: '',
        component: DashboardComponent,
    },
	{
		path: 'task-details/:projectId/:taskId',
		component: TaskDetailsComponent,
	},
] as Routes;
