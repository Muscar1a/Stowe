//go:build !windows

package pty

import (
	"context"
	"os"
	"os/exec"

	"github.com/creack/pty"
)

type platformPTY struct {
	ptmx    *os.File
	process *exec.Cmd
}

func newPlatformPTY(ctx context.Context, cols, rows uint16, binary string, args []string, dir string) (*platformPTY, error) {
	cmd := exec.CommandContext(ctx, binary, args...)
	cmd.Dir = dir

	ptmx, err := pty.StartWithSize(cmd, &pty.Winsize{Cols: cols, Rows: rows})
	if err != nil {
		return nil, err
	}

	return &platformPTY{ptmx: ptmx, process: cmd}, nil
}

func (p *platformPTY) Read(buf []byte) (int, error) {
	return p.ptmx.Read(buf)
}

func (p *platformPTY) Write(data []byte) (int, error) {
	return p.ptmx.Write(data)
}

func (p *platformPTY) Resize(cols, rows uint16) error {
	return pty.Setsize(p.ptmx, &pty.Winsize{Cols: cols, Rows: rows})
}

func (p *platformPTY) Close() error {
	if p.process.Process != nil {
		p.process.Process.Kill()
	}
	return p.ptmx.Close()
}

func (p *platformPTY) cmd() *exec.Cmd { return p.process }
