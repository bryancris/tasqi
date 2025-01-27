import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export function AddTaskDrawer() {
  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white">
          + Add a task
        </Button>
      </DrawerTrigger>
      <DrawerContent side="left" className="w-[400px]">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle>Add New Task</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Enter task title" />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="date">Date</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Unscheduled</span>
                <Switch id="date" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Add description" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input id="start-time" type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input id="end-time" type="time" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="reminders">Reminders</Label>
              <Switch id="reminders" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes Before Due</Label>
              <Input id="minutes" type="number" placeholder="Enter minutes" />
            </div>
            
            <Button className="w-full bg-black text-white hover:bg-gray-800">
              Add Task
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}