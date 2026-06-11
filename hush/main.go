package main

import (
        "io/ioutil"
        "log"
        "os"

        "github.com/btwiuse/hush"
)

func main() {
        log.SetOutput(ioutil.Discard)
        os.Exit(hush.Run())
}
