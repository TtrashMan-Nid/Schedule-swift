
"use client";

import { useState, useEffect, Fragment } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, FileDown, Plus, Minus, HelpCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function TimetablePage() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [lessons, setLessons] = useState<{[day: string]: number[]}>({});
  const [classNames, setClassNames] = useState<{[day: string]: string[]}>({});
  const [schedule, setSchedule] = useState<{[day: string]: { [lesson: number]: { [className: string]: string } }}>({});
  const [newClassName, setNewClassName] = useState<{[day: string]: string}>({});

  const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"];

  const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            setShowTutorial(true);
            localStorage.setItem('hasSeenTutorial', 'true');
        }
    }, []);

  useEffect(() => {
    const initialLessonsState: {[day: string]: number[]} = {};
    const initialClassNamesState: {[day: string]: string[]} = {};
    const initialScheduleState: {[day: string]: { [lesson: number]: { [className: string]: string } }} = {};
    const initialNewClassNameState: {[day: string]: string} = {};

    days.forEach(day => {
      initialLessonsState[day] = Array.from({ length: 5 }, (_, i) => i + 1);
      initialClassNamesState[day] = [];
      initialScheduleState[day] = {};
      initialNewClassNameState[day] = "";
    });

    setLessons(initialLessonsState);
    setClassNames(initialClassNamesState);
    setSchedule(initialScheduleState);
    setNewClassName(initialNewClassNameState);
  }, []);

  const handleDayClick = (day: string) => {
    setSelectedDay(day === selectedDay ? null : day);
  };

  const addLesson = (day: string) => {
    setLessons(prevLessons => {
      const currentDayLessons = prevLessons[day] || [];
      const nextLessonNumber = currentDayLessons.length > 0 ? Math.max(...currentDayLessons) + 1 : 1;
      return {
        ...prevLessons,
        [day]: [...currentDayLessons, nextLessonNumber],
      };
    });
  };

  const removeLesson = (day: string) => {
    setLessons(prevLessons => {
      const dayLessons = prevLessons[day] || [];
      if (dayLessons.length > 1) {
        return {
          ...prevLessons,
          [day]: dayLessons.slice(0, -1),
        };
      }
      return prevLessons;
    });
  };

  const handleAddClass = (day: string) => {
    const classNameToAdd = (newClassName[day] || "").trim();
    if (!classNameToAdd) {
      // Optionally, inform user that class name cannot be empty
      return;
    }

    setClassNames(prevClassNames => {
      const currentClassNames = prevClassNames[day] || [];
      if (!currentClassNames.includes(classNameToAdd)) {
        return {
          ...prevClassNames,
          [day]: [...currentClassNames, classNameToAdd],
        };
      }
      // Optionally, inform user that class name already exists
      return prevClassNames;
    });
    setNewClassName(prev => ({ ...prev, [day]: "" }));
  };

  const handleRemoveClass = (day: string, classNameToRemove: string) => {
    setClassNames(prevClassNames => ({
      ...prevClassNames,
      [day]: (prevClassNames[day] || []).filter(className => className !== classNameToRemove),
    }));

    setSchedule(prevSchedule => {
      const dayScheduleData = prevSchedule[day];
      if (!dayScheduleData) {
        return prevSchedule;
      }

      const newDayScheduleData = { ...dayScheduleData };
      Object.keys(newDayScheduleData).forEach(lessonNumStr => {
        const lessonNumber = parseInt(lessonNumStr, 10);
        if (newDayScheduleData[lessonNumber] && newDayScheduleData[lessonNumber][classNameToRemove]) {
          const updatedLessonSubjects = { ...newDayScheduleData[lessonNumber] };
          delete updatedLessonSubjects[classNameToRemove];
          newDayScheduleData[lessonNumber] = updatedLessonSubjects;
          // If the lesson becomes empty, remove it
          if (Object.keys(updatedLessonSubjects).length === 0) {
            delete newDayScheduleData[lessonNumber];
          }
        }
      });
      return {
        ...prevSchedule,
        [day]: newDayScheduleData,
      };
    });
  };

  const updateSchedule = (day: string, lessonNumber: number, className: string, subject: string) => {
    setSchedule(prevSchedule => {
      const updatedDaySchedule = { ...(prevSchedule[day] || {}) };
      const updatedLessonSchedule = { ...(updatedDaySchedule[lessonNumber] || {}) };
      updatedLessonSchedule[className] = subject;
      updatedDaySchedule[lessonNumber] = updatedLessonSchedule;
      return { ...prevSchedule, [day]: updatedDaySchedule };
    });
  };

  const handleExport = (day: string) => {
    const data = [];
    const dayClassNames = classNames[day] || [];
    const dayLessons = lessons[day] || [];
    const daySchedule = schedule[day] || {};

    const header = ['Предмет', ...dayClassNames];
    data.push(header);

    for (const lessonNumber of dayLessons) {
      const row = [lessonNumber.toString()];
      for (const className of dayClassNames) {
        row.push(daySchedule[lessonNumber]?.[className] || '');
      }
      data.push(row);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, day);
    XLSX.writeFile(wb, `${day}-schedule.xlsx`);
  };


  return (
      <div className="flex h-screen bg-background">

        <AlertDialog open={showTutorial} onOpenChange={setShowTutorial}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Добро пожаловать!</AlertDialogTitle>
              <AlertDialogDescription>
                Это краткое руководство поможет вам начать работу с приложением:
                <br /><br />
                1. <b>Выбор дня:</b> Нажмите на кнопку с названием дня недели, чтобы открыть редактор для этого дня.
                <br />
                2. <b>Добавление классов:</b> Введите название класса и нажмите "Добавить класс".
                <br />
                3. <b>Добавление/удаление уроков:</b> Используйте кнопки "+" и "-" для управления количеством уроков.
                <br />
                4. <b>Редактирование расписания:</b> Введите название предмета в соответствующую ячейку таблицы.
                <br />
                5. <b>Экспорт расписания:</b> Нажмите "Экспорт", выберите день и скачайте расписание в формате Excel.
                <br /><br />
                Приятного использования!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowTutorial(false)}>Начать!</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex-1 p-4 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle>Редактор Расписания</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap justify-start items-center gap-2 mt-2">
                  {days.map((day) => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? "secondary" : "outline"}
                      onClick={() => handleDayClick(day)}
                    >
                      {day}
                    </Button>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Экспорт <FileDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {days.map((day) => (
                        <DropdownMenuItem key={day} onClick={() => handleExport(day)}>
                          {day}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full ml-auto"
                      onClick={() => setShowTutorial(true)}
                  >
                    <HelpCircle className="h-5 w-5"/>
                  </Button>
                </div>
                {selectedDay && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Редактировать: {selectedDay}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 mb-4">
                                    <Input
                                        type="text"
                                        placeholder="Название класса"
                                        value={newClassName[selectedDay] || ""}
                                        onChange={(e) => setNewClassName(prevNewClassName => ({
                                          ...prevNewClassName,
                                          [selectedDay]: e.target.value,
                                        }))}
                                        className="max-w-xs"
                                    />
                                    <Button onClick={() => handleAddClass(selectedDay)}>Добавить Класс</Button>
                                    <Button variant="outline" onClick={() => removeLesson(selectedDay)}><Minus className="h-4 w-4"/></Button>
                                    <Button variant="outline" onClick={() => addLesson(selectedDay)}><Plus className="h-4 w-4"/></Button>
                                </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px] min-w-[100px]">Урок</TableHead>
                                            {(classNames[selectedDay] || []).map((classNameItem) => (
                                                <TableHead key={classNameItem}
                                                           className="w-[180px] min-w-[180px] relative px-2 py-1">
                                                                <div className="flex items-center justify-between">
                                                                  <span className="font-semibold">{classNameItem}</span>
                                                                  <Button
                                                                      variant="ghost"
                                                                      size="icon"
                                                                      className="h-6 w-6"
                                                                      onClick={() => handleRemoveClass(selectedDay, classNameItem)}
                                                                  >
                                                                      <Trash2 className="h-4 w-4"/>
                                                                  </Button>
                                                                </div>
                                                            </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(lessons[selectedDay] || []).map((lessonNumber) => (
                                            <TableRow key={lessonNumber}>
                                                <TableCell className="font-medium">{lessonNumber}</TableCell>
                                                {(classNames[selectedDay] || []).map((classNameItem) => (
                                                    <TableCell key={classNameItem} className="p-1">
                                                        <Input
                                                            type="text"
                                                            placeholder="Предмет"
                                                            value={schedule[selectedDay]?.[lessonNumber]?.[classNameItem] || ''}
                                                            onChange={(e) => {
                                                                updateSchedule(selectedDay, lessonNumber, classNameItem, e.target.value);
                                                            }}
                                                            className="w-full min-w-[150px] h-10 text-sm"
                                                        />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}

