package exception

import "fmt"

func PanicLogging(err interface{}) {
	if err != nil {
		// panic(err)
		fmt.Println(err)
	}
}
