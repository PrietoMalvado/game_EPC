import pygame
import random

pygame.init()

BLOCK_SIZE = 30
GRID_WIDTH = 10
GRID_HEIGHT = 20
SCREEN_WIDTH = BLOCK_SIZE * (GRID_WIDTH*8)
SCREEN_HEIGHT = BLOCK_SIZE * GRID_HEIGHT

# Colors
BLACK = (0, 0, 0) #BACKGROUND COLOR
WHITE = (255, 255, 255) #TEXT COLOR
RED = (255, 0, 0) #PIECE COLOR I
GREEN = (0, 255, 0) #PIECE COLOR J
BLUE = (0, 0, 255) #PIECE COLOR L
YELLOW = (255, 255, 0) #PIECE COLOR O
CYAN = (0, 255, 255) #PIECE COLOR S
MAGENTA = (255, 0, 255) #PIECE COLOR T
ORANGE = (255, 165, 0) #PIECE COLOR Z
GRAY = (128, 128, 128) #LINES COLOR

SHAPES = [
    [[1, 1, 1, 1]],  # I
    [[1, 0, 0], [1, 1, 1]],  # J
    [[0, 0, 1], [1, 1, 1]],  # L
    [[1, 1], [1, 1]],  # O
    [[0, 1, 1], [1, 1, 0]],  # S
    [[0, 1, 0], [1, 1, 1]],  # T
    [[1, 1, 0], [0, 1, 1]], # Z
]

COLORS = [RED, GREEN, BLUE, YELLOW, CYAN, MAGENTA, ORANGE]

class Tetromino:
    def __init__(self):
        self.shape_idx = random.randint(0, len(SHAPES) - 1)
        self.shape = [row[:] for row in SHAPES[self.shape_idx]]
        self.color = COLORS[self.shape_idx]
        self.x = GRID_WIDTH // 2 - len(self.shape[0]) // 2
        self.y = 0
    def rotate(self):
        self.shape = [[self.shape[y][x] for y in range(len(self.shape)) for x in range(len(self.shape[0]) - 1, -1, -1)]
                        for row in range(len(self.shape[0]))]

class TetrisGame:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Tetris")
        self.clock = pygame.time.Clock()
        self.grid = [[BLACK for _ in range(GRID_WIDTH)] for _ in range(GRID_HEIGHT)]
        self.current_piece = Tetromino()
        self.next_piece = Tetromino()
        self.game_over = False
        self.score = 0
        self.level = 1
        self.lines_cleared = 0
        self.drop_speed = 500  # milliseconds
        self.font = pygame.font.SysFont('Arial', 24)
        
    def valid_move(self, piece, dx, dy):
        for i in range(len(piece.shape)):
            for j in range(len(piece.shape[0])):
                if piece.shape[i][j]:
                    new_x = piece.x + j + dx
                    new_y = piece.y + i + dy
                    if new_x < 0 or new_x >= GRID_WIDTH or new_y >= GRID_HEIGHT:
                        return False
                    if new_y >= 0 and self.grid[new_y][new_x] != BLACK:
                        return False
