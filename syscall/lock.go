// compat file to make wanix with flock build with vanilla toolchain

package syscall

import "syscall"

const EAGAIN = syscall.EAGAIN

const (
	LOCK_SH = 0x1
	LOCK_EX = 0x2
	LOCK_NB = 0x4
	LOCK_UN = 0x8
)

