#include <iostream> 
#ifndef KVP_H 
#define KVP_H

using namespace std;

template <typename T>
struct keyValuePair {
	T key;
	string pathOfFile;

	keyValuePair(T k = 0, string pf = "") {
		key = k;
		pathOfFile = pf;
	}

	// Overload the assignment operator '='
	keyValuePair<T>& operator=(const keyValuePair<T>& other) {
		if (this != &other) {
			key = other.key;
			pathOfFile = other.pathOfFile;
		}
		return *this;
	}

	// Overload the equality operator '=='
	bool operator==(const keyValuePair<T>& other) const {
		return (key == other.key) && (pathOfFile == other.pathOfFile);
	}

	// Overload the less than operator '<'
	bool operator<(const keyValuePair<T>& other) const {
		return key < other.key;
	}

	// Overload the greater than operator '>'
	bool operator>(const keyValuePair<T>& other) const {
		return key > other.key;
	}
};

#endif // !KVP_H 