//go:build windows

package pty

import (
	"context"
	"fmt"
	"os/exec"
	"strings"

	"github.com/UserExistsError/conpty"
)

type platformPTY struct {
	cpty *conpty.ConPty
}

func newPlatformPTY(_ context.Context, cols, rows uint16, binary string, args []string, dir string) (*platformPTY, error) {
	// ConPTY doesn't expose a working-directory option, so we wrap in cmd /c
	// to cd first. For resume (no dir change needed), dir == home which is fine.
	var cmdLine string
	if dir != "" {
		escaped := strings.ReplaceAll(dir, `"`, `""`)
		inner := binary
		if len(args) > 0 {
			inner += " " + strings.Join(args, " ")
		}
		cmdLine = fmt.Sprintf(`cmd.exe /c "cd /d "%s" && %s"`, escaped, inner)
	} else {
		cmdLine = binary
		if len(args) > 0 {
			cmdLine += " " + strings.Join(args, " ")
		}
	}

	cpty, err := conpty.Start(cmdLine, conpty.ConPtyDimensions(int(cols), int(rows)))
	if err != nil {
		return nil, err
	}
	return &platformPTY{cpty: cpty}, nil
}

func (p *platformPTY) Read(buf []byte) (int, error) {
	return p.cpty.Read(buf)
}

func (p *platformPTY) Write(data []byte) (int, error) {
	return p.cpty.Write(data)
}

func (p *platformPTY) Resize(cols, rows uint16) error {
	return p.cpty.Resize(int(cols), int(rows))
}

func (p *platformPTY) Close() error {
	return p.cpty.Close()
}

func (p *platformPTY) cmd() *exec.Cmd { return nil }
