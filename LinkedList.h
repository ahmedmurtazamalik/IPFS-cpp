//#pragma once
//#include<iostream>
//#include<conio.h>
//
//using namespace std;
//template <class T>
//class Node
//{
//public:
//	T data;
//	Node* next;
//
//	Node()
//	{
//		data = 0;
//		next = NULL;
//	}
//
//	Node(T d, Node* n)
//	{
//		data = d;
//		next = n;
//	}
//
//	Node(T d)
//	{
//		data = d;
//		next = NULL;
//	}
//
//	void setData(T d)
//	{
//		data = d;
//	}
//
//	void setNext(Node* n)
//	{
//		next = n;
//	}
//
//	T getData()
//	{
//		return data;
//	}
//
//	Node* getNext()
//	{
//		return next;
//	}
//
//};
//
////template <class T>
////class SLinkedList {
////
////public:
////
////	Node<T>* head;
////
////	SLinkedList()
////	{
////		head = NULL;
////	}
////	void insert(T data)
////	{
////		Node<T>* temp;
////		Node<T>* n = new Node <T>(data);
////		if (head == NULL)
////		{
////			head = n;
////		}
////		else
////		{
////			temp = head;
////			while (temp->next != NULL)
////			{
////				temp = temp->next;
////			}
////			temp->next = n;
////			n->next = NULL;
////		}
////	}
////	void insertAtHead(T data)
////	{
////		Node<T>* n = new Node <T>(data);
////
////		n->next = head;
////		head = n;
////	}
////	bool IsEmpty()
////	{
////		if (head)
////			return false;
////		return true;
////	}
////	T getData(int ind)
////	{
////		int pos = 0;
////		Node <T>* temp = head;
////		while (temp->next != NULL && pos != ind)
////		{
////			temp = temp->next;
////			pos++;
////		}
////		return temp->data;
////	}
////	int search(T data)
////	{
////		Node<T>* n = new Node <T>(data);
////		n = head;
////		int counter = 0;
////		while (n->data != data)
////		{
////			counter++;
////			n = n->next;
////		}
////		return counter;
////	}
////	void update(int index, T data)
////	{
////		Node<T>* n = new Node <T>;
////		n = head;
////		int counter = 0;
////		while (counter != index)
////		{
////			counter++;
////			n = n->next;
////		}
////		n->setData(data);
////	}
////	void InsertAtIndex(T data, int index)
////	{
////
////		Node<T>* temp;
////		temp = head;
////		int counter = 0;
////
////		if (head == nullptr)
////		{
////			head = new Node<T>(data);
////			return;
////		}
////
////		while (temp->next != NULL && counter != index)
////		{
////			counter++;
////			temp = temp->next;
////		}
////		insert(data);
////	}
////	void remove(T data)
////	{
////		Node<T>* pre = NULL;
////		Node<T>* temp = head;
////		int counter = 1;
////		while (temp && temp->data != data)
////		{
////			counter++;
////			pre = temp;
////			temp = temp->next;
////		}
////		if (temp)
////		{
////			if (pre)
////			{
////				pre->next = temp->next;
////				delete temp;
////			}
////			else
////			{
////				head = temp->next;
////				delete temp;
////			}
////		}
////
////	}
////	void print()
////	{
////		Node<T>* temp;
////		temp = head;
////		while (temp->next)
////		{
////			cout << temp->data;
////			temp = temp->next;
////		}
////	}
////	int length()
////	{
////		Node<T>* temp;
////		temp = head;
////		int counter = 0;
////		while (temp)
////		{
////			counter++;
////			temp = temp->next;
////		}
////		return counter;
////	}
////	void mergeLists(SLinkedList obj2) {
////
////		SLinkedList list;
////
////		Node<T>* l1;
////		l1 = head;
////		Node<T>* l2;
////		l2 = obj2.head;
////
////		T arr[8] = { 0 };
////
////
////		for (int i = 0; i < 4; i++)
////		{
////			arr[i] = l1->data;
////			l1 = l1->next;
////
////
////		}
////		for (int i = 4; i < 8; i++)
////		{
////			arr[i] = l2->data;
////			l2 = l2->next;
////
////
////		}
////		for (int i = 0; i < 8; i++)
////		{
////			for (int j = i + 1; j < 8; j++)
////			{
////				if (arr[i] > arr[j]) {
////					T temp = arr[i];
////					arr[i] = arr[j];
////					arr[j] = temp;
////				}
////			}
////
////
////		}
////
////		for (int i = 0; i < 8; i++)
////		{
////			cout << arr[i];
////
////
////		}
////
////		for (int i = 0; i < 8; i++)
////		{
////
////			list.insert(arr[i]);
////
////		}
////
////		this->head = list.head;
////
////
////	}
////};