from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def target_exists(makefile: Path, target: str) -> bool:
    return any(line.startswith(f"{target}:") for line in makefile.read_text().splitlines())


def test_makefiles_expose_init_and_server_targets():
    expected_targets = {
        ROOT / "Makefile": ["init", "backend-init", "frontend-init", "dev", "backend", "frontend"],
        ROOT / "backend" / "Makefile": ["init", "dev", "test"],
        ROOT / "frontend" / "Makefile": ["init", "dev", "build", "test"],
    }

    for makefile, targets in expected_targets.items():
        assert makefile.exists(), f"{makefile} should exist"
        for target in targets:
            assert target_exists(makefile, target), f"{makefile} should expose `{target}`"
