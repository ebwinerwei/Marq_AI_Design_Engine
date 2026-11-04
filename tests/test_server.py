import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from server import validate, SCHEMA
class Boundary(unittest.TestCase):
 def test_invalid(self):
  p=dict(base='#d5d7d5',mid='#9caab9',dark='#344966',cols=72,rows=12,run=4,density=25,middle=12,seed=2401,style='vertical')
  self.assertTrue(validate(p))
  for k,v in [('cols',999999),('base','javascript:alert(1)'),('style','execute'),('rows',True)]:
   self.assertFalse(validate(dict(p,**{k:v})))
  self.assertFalse(validate(None))
 def test_schema(self):
  self.assertFalse(SCHEMA['additionalProperties'])
if __name__=='__main__': unittest.main()
