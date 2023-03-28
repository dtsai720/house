package main

import (
	"fmt"
	"math/rand"
	"time"
)

func Compress(chars []byte) int {
	if len(chars) == 1 {
		return 1
	}
	chars = append(chars, byte(0))
	slow, fast, count := 0, 0, 0
	for fast < len(chars)-1 {
		if chars[fast] == chars[fast+1] {
			fast++
			count++
			continue
		}
		chars[slow] = chars[fast]
		slow++
		fast++
		count++
		fmt.Println(count, slow, fast)
		for count > 0 {
			chars[slow] = byte(count%10) + '0'
			slow++
			count /= 10
		}
	}
	return slow
}

func Build(size int) [][]int {
	candidate := make([]int, 0, size)
	for i := 0; i < size; i++ {
		candidate = append(candidate, i)
	}
	var output [][]int
	var recursive func(i int, in []int)
	recursive = func(cur int, in []int) {
		if cur == size {
			dest := make([]int, size)
			copy(dest, in)
			output = append(output, dest)
			return
		}
		for i := cur; i < size; i++ {
			in[i], in[cur] = in[cur], in[i]
			recursive(cur+1, in)
			in[i], in[cur] = in[cur], in[i]
		}

	}
	recursive(0, candidate)
	return output
}

func FindOne(candidate [][]int, rounds int, kinds int) [][]int {
	var recursive func(output [][]int)
	maxCount := rounds / kinds

	fmt.Println(maxCount)
	isValid := func(in []int, output [][]int) bool {
		if len(output) == 0 {
			return true
		}

		back := output[len(output)-1]
		for i := 0; i < kinds; i++ {
			if in[i] == back[i] {
				return false
			}
		}

		if len(output)%2 == 1 {
			for i := 0; i < kinds; i++ {
				if in[i] < 2 && back[i] < 2 {
					return false
				}
				if in[i] > 1 && back[i] > 1 {
					return false
				}
			}
		}

		for i := 0; i < kinds; i++ {
			array := make([]int, kinds)
			array[in[i]]++
			for _, row := range output {
				array[row[i]]++
			}

			for _, num := range array {
				if num > maxCount {
					return false
				}
			}
		}

		return true
	}

	done := false
	var result [][]int
	hasVisit := make(map[int]bool)

	recursive = func(output [][]int) {
		if done {
			return
		}

		if len(output) == rounds {
			done = true
			result = output
			return
		}

		for idx, num := range candidate {
			if !hasVisit[idx] && isValid(num, output) {
				hasVisit[idx] = true
				recursive(append(output, num))
				hasVisit[idx] = false
			}
		}
	}

	recursive([][]int{})
	return result
}

func main() {
	unit := 4
	member := 12
	var results [][]int
	keep := true
	for keep {
		rand.Seed(time.Now().UnixNano())
		candidate := Build(unit)
		fmt.Println(len(candidate))
		rand.Shuffle(len(candidate), func(i, j int) {
			candidate[i], candidate[j] = candidate[j], candidate[i]
		})
		keep = false
		results = FindOne(candidate, member, unit)
		for i := 0; i < unit; i++ {
			array := make([]int, unit)
			for _, result := range results {
				array[result[i]]++
			}
			// fmt.Println(array)
			for _, num := range array {
				if num > member/unit {
					keep = true
				}
			}
		}
	}

	for idx, result := range results {
		fmt.Printf("%02d\t", idx+1)
		for _, num := range result {
			fmt.Printf("%c\t", num+65)
		}
		fmt.Println()
	}

}
